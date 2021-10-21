const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const rect = canvas.getBoundingClientRect();
//установка размеров полотна
canvas.width = canvas.scrollWidth;
canvas.height = canvas.scrollHeight;

//массив маркеров
var markers = [];
//существует ли на полотне движущийся маркер
var markerIsExist = false;

//инициализирует хаб для общения между сервером и клиентами
const hubConnection = new signalR.HubConnectionBuilder()
    .withUrl("/index")
    .build();

//инициализация методов хаба
hubConnection.on("GetAllMarkers", function (data) {       
    markers = data;
    rendering();
});

hubConnection.on("GetNewMarker", function (data) {
    markers.push(data);
    rendering();
});

hubConnection.on("DeleteAllMarkers", function () {       
   deleteAll();
});

hubConnection.on("DeleteLastMarker", function () {
    deleteLast();
});

//Добавляет маркер на полотно, при нажатие мыши
canvas.addEventListener("mousedown", async function (e) {
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    hubConnection.invoke("Send", [x,y]);
    await drawMarker(x, y, '#1f044a');
    markers.push([x, y]);

    rendering();    
    postRequest(0);    
});

//Реализует полную отрисовку на полотне
function rendering(){
    if (markers.length > 1 && !markerIsExist) {
        markerIsExist = true;
        moveMarker();
    }
    else if(markers.length == 1) {
        drawMarker(markers[0][0], markers[0][1], '#1f044a');
    }
}

//Отрисовывает движущийся маркер
async function moveMarker() {
    while (markerIsExist) {
        for (let i = 0; i < markers.length - 1; i++) {
            await drawSection(i + 1, i);
        }

        await drawSection(0, markers.length - 1);
    } 
}

//Отрисовка отрезка между текущей точкой и следующей
async function drawSection(markFromIndex, markToIndex) {
    if (!markerIsExist) {
        return;
    }

    let delta_x = (markers[markFromIndex][0] - markers[markToIndex][0]) / 30;
    let delta_y = (markers[markFromIndex][1] - markers[markToIndex][1]) / 30;
    let x = markers[markToIndex][0];
    let y = markers[markToIndex][1];

    for (let j = 1; j < 30; j++) {
        if (markerIsExist) {
            await drawMarker(x + delta_x * j, y + delta_y * j, '#650cf5');
            await wait(50);
            ctx.clearRect(0, 0, 2000, 2000);
        }

        for (let k = 0; k < markers.length; k++) {
            await drawMarker(markers[k][0], markers[k][1], '#1f044a');
        }
    }
}

//Рисует маркер цвета color с координатами x, y
async function drawMarker(x, y, color) {
    ctx.beginPath();
    await ctx.arc(x, y, 4, 0, Math.PI * 2, true);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
}

//Останавливает выполнение программы на delay миллисекунд
function wait(delay) {
    return new Promise(function (resolve) {
        setTimeout(resolve, delay);
    });
}

//Удаляет все маркеры 
function deleteAll() {
    ctx.beginPath();
    ctx.clearRect(0, 0, 2000, 2000);
    ctx.closePath();
    markers.length = 0;
    markerIsExist = false;
}

//Удаляет последний маркер 
function deleteLast() {
    ctx.beginPath();
    ctx.clearRect(0, 0, 2000, 2000);
    ctx.closePath();
    markers.pop();

    if (markers.length < 2) {
        markerIsExist = false;
    }
}

//Удаляет все маркеры в текущем клиенте
//Сообщение к хабу "Все маркеры были удалены"
//Запрос на сервер, записать данное событие в бд
function deleteAllInCurrentClient() {
    deleteAll();
    postRequest(2);
    hubConnection.invoke("DeleteAll");
}

//Удаляет последний маркер  в текущем клиенте
//Сообщение к хабу "Последний маркер был удален"
//Запрос на сервер, записать данное событие в бд
function deleteLastInCurrentClient() {
    deleteLast();    
    postRequest(1);
    hubConnection.invoke("DeleteLast");
}

//Устанавливает размеры полотна
function resizeCanvas() {
    canvas.width = canvas.scrollWidth;
    canvas.height = canvas.scrollHeight;
}

//Преобразует входной файл в координаты маркеров
function loadFile() {
    markers = [];
    var reader = new FileReader();
    try {
        var fileToRead = document.getElementById('inputFile').files[0];
        reader.readAsText(fileToRead);

        reader.onload = function () {
            let arr = reader.result.split(" ");
            arr.forEach(function (item, i, arr) {
                let items = item.split(",");
                markers.push([parseInt(items[0]), parseInt(items[1])]);
            });
        }
        reader.onerror = function () {
            console.log(reader.error)
        }
    }
    catch (e) {

    }
   
    return markers;
}

//Отрисовывает маркеры из файла
async function drawMarkerFromFile() {
    let markers = await loadFile();
    await wait(1000);

    //Вызывает методы хаба, для синхронизации с другими клиентами
    hubConnection.invoke("LoadFromFile",markers);
    hubConnection.invoke("GetFromFile");

    rendering();
}

//Отправляет координаты маркеров на сервер
function sendPosition() {
    $.ajax({
        url: "/home/saveposition",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(markers),
        success: function (data) {
        }
    });
}

//Отправляет события маркеров(создание, удаление) на сервер
function postRequest(action) {
    let userName = document.querySelector("input[name='username']").value;
    if (userName != "") {
        $.ajax({
            url: "/home/create",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify({ name: userName, event: action, time: new Date() }),
            success: function (data) {
            }
        });
    }
}

//запуск хаба
hubConnection.start();