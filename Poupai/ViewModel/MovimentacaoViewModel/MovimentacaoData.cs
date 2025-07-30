using Microsoft.AspNetCore.Mvc.Rendering;
using Poupai.Models;

namespace Poupai.ViewModel.MovimentacaoViewModel
{
    public class MovimentacaoData
    {
        public int Id { get; set; }
        public string ValorSt { get; set; }
        public decimal Valor { get; set; }
        public string? TipoName { get; set; }
        public string? TipoDescricao { get; set; }
        public string Data { get; set; }
        public string? Categoria { get; set; }
        public string? Descricao { get; set; }
        public decimal? Saldo { get; set; }
        public string? Usuario { get; set; }
        public string EntraOuSaida { get; set; }
        public bool IsEntrada { get; set; }
        public string Fixa {get; set;}
        public IList<SelectListItem> ListaTipos { get; set; }

        public MovimentacaoData() { }
        public MovimentacaoData(Movimentacao mov) 
        {
            Id = mov.Id;
            ValorSt = ((decimal)mov.Valor).ToString("N2");
            Valor = mov.Valor ?? 0;
            TipoName = mov.Tipo.Nome;
            EntraOuSaida = mov.Tipo.IsEntrada == true ? "Entrada" : "Saída";
            TipoDescricao = mov.Tipo.Descricao;
            Data = mov.Data.ToString("dd/MM/yyyy");
            Categoria = mov.Categoria;
            Descricao = mov.Descricao;
            Saldo = mov.Saldo;
            IsEntrada = mov.IsEntrada;
            Fixa = mov.IsFixaOuDiaria == true ? "Sim" : "Não";
        }
    }
}
