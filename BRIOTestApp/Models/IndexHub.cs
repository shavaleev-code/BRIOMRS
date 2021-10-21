using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BRIOTestApp.Models
{
    public class IndexHub : Hub
    {
        //Список актуальных координат 
        public static List<int[]> Markers = new List<int[]>();

        //Отправляет новую координату всем клиентам, кроме клиента обращающеося к хабу
        public async Task Send(int[] markers)
        {
            Markers.Add(markers);
            await this.Clients.Others.SendAsync("GetNewMarker", markers);                
        }

        //Отправляет сигнал удалить последнюю координату всем клиентам, кроме клиента обращающеося к хабу
        public async Task DeleteLast()
        {           
            await this.Clients.Others.SendAsync("DeleteLastMarker");
            Markers.RemoveAt(Markers.Count - 1);
        }

        //Отправляет сигнал удалить все координаты всем клиентам, кроме клиента обращающеося к хабу
        public async Task DeleteAll()
        {
            await this.Clients.Others.SendAsync("DeleteAllMarkers");
            Markers.Clear();
        }

        //Загружает список коодинат из файла
        public void LoadFromFile(int[][] markers)
        {
            Markers.Clear();
            for (var i=0;i<markers.Length;i++)
            {
                Markers.Add(markers[i]);
            }            
        }

        //Отправляет актуальные координаты всем клиентам, кроме клиента обращающеося к хабу
        public async Task GetFromFile()
        {
            await Clients.Others.SendAsync("GetAllMarkers", Markers);           
        }

        //Срабатывает при первом подключении клиента
        //Отправляет актуальные координаты этому клиенту
        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("GetAllMarkers", Markers);
            await base.OnConnectedAsync();
        }
    }
}
