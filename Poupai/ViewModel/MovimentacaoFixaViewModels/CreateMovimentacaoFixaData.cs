using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;
using Poupai.Models;
using Poupai.Servicos;
using Microsoft.AspNetCore.Mvc;

namespace Poupai.ViewModel.MovimentacaoFixaViewModels
{
    public class CreateMovimentacaoFixaData
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        [Remote("VerificarNome", "MovimentacaoFixa", AdditionalFields = "Id")]
        public string? Nome { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        public int? TipoMovimentacaoId { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        public string? ValorS { get; set; }
        public decimal? Valor { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        [Range(1, 31, ErrorMessage = "O dia de vencimento deve estar entre 1 e 31.")]
         public int? DiaVencimento { get; set; }
        public DateTime? DataVencimento { get; set; }
        public DateTime? DataFim { get; set; }
        public DateTime? DataCreate { get; set; }
        public string? FormaPagamento { get; set; }
        public bool IsEntrada { get; set; }
        public DateTime? DataPagamento { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        public IList<SelectListItem> ListaTipos { get; set; }

        public CreateMovimentacaoFixaData() { }
        public CreateMovimentacaoFixaData(List<TipoMovimentacao> tipoMovi)
        {
            ListaTipos = Listas.ListTipo(tipoMovi);
        }
         public CreateMovimentacaoFixaData(MovimentacaoFixa moviFix, List<TipoMovimentacao> tipoMovi)
        {
            Id = moviFix.Id;
            Nome = moviFix.Nome;
            ValorS = moviFix.Valor.ToString("N2");
            DataPagamento = moviFix.DataUltimoPagamento;
            DiaVencimento = moviFix.DiaVencimento;
            ListaTipos = Listas.ListTipo(tipoMovi, moviFix.TipoMovimentacaoId);
        }
    }
}
