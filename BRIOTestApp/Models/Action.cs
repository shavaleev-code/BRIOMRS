using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BRIOTestApp.Models
{
    public enum Event
    {
        CreateMark = 0,
        DeleteLastMark = 1,
        DeleteAllMarks = 2
    }

    public class Action
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public Event Event { get; set; }
        public DateTime Time { get; set; }
    }
}
