using BRIOTestApp.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;

namespace BRIOTestApp.Controllers
{
    public class HomeController : Controller
    {
        private ApplicationContext db;

        public HomeController(ApplicationContext context)
        {
            db = context;
        }

        public IActionResult Index()
        {           
            return View();
        }

        public IActionResult ActionHistory()
        {                    
            return View(db.Actions.ToList());
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        //Достает все записи из бд
        [HttpGet]
        public IEnumerable<Models.Action> Get()
        {
            return db.Actions;
        }

        //Создает запись в бд
        [HttpPost]
        public void Create([FromBody] Models.Action action)
        {
            DeleteExtraRows();
            db.Actions.Add(action);
            db.SaveChanges();
        }

        //Удалаяет первую запись из бд
        [HttpDelete]
        public void Delete()
        {
            try 
            {
                var lastAction = db.Actions.OrderBy(x => x.Id).FirstOrDefault();
                db.Actions.Remove(lastAction);
                db.SaveChanges();
            } 
            catch(Exception e) 
            {
            }
            
        }

        //Удаляет лишнии записи в бд
        public void DeleteExtraRows()
        {
            var count = db.Actions.Count();
            for(var i = 0; i < count - 19; i++)
            {
                Delete();
            }
        }

        //Сортировка таблицы действий по имени
        public IActionResult NameSort()
        {
            return View("ActionHistory", db.Actions.OrderBy(x => x.Name).ToList());         
        }

        //Сортировка таблицы действий по дате
        public IActionResult DateSort()
        {
            return View("ActionHistory", db.Actions.OrderBy(x => x.Time).ToList());
        }

        //Сохраняет координаты в текстовый файл
        [HttpPost]
        public void SavePosition([FromBody]int[][] positions)
        {
            if(positions.Length == 0)
            {
                return;
            }

            string myDocuments = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            string filepath = Path.Combine(myDocuments, "Position.txt");
            try
            {
                using (StreamWriter sw = new StreamWriter(filepath, false, System.Text.Encoding.Default))
                {
                    int i = 0;
                    for(; i < positions.Length - 1;i++)
                    {
                        sw.Write($"{positions[i][0]},{positions[i][1]} ");
                    }
                    sw.Write($"{positions[i][0]},{positions[i][1]}");
                }
            }
            catch(Exception e)
            {

            }
        }
    }
}
