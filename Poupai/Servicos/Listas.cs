using Microsoft.AspNetCore.Mvc.Rendering;
using Poupai.Models;

namespace Poupai.Servicos
{
    public class Listas
    {

        public static IList<SelectListItem> ListTipo(List<TipoMovimentacao> listTipo, int? selected = null)
        {
            var listEquipments = new List<SelectListItem>();

            foreach (var t in listTipo)
            {
                var item = new SelectListItem { Text = $"{ t.Nome}", Value = t.Id.ToString() };
                if (t.Id == selected)
                {
                    item.Selected = true;
                }
                listEquipments.Add(item);
            }
            return listEquipments;
        }
    }
}
