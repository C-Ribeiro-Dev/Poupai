using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;
using Poupai.Models;
using Poupai.Servicos;

namespace Poupai.ViewModel.MovimentacaoViewModel
{
    public class CreateMovimentacaoData
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        public decimal? Valor { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        public int? TipoId { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        public virtual TipoMovimentacao Tipo { get; set; }
        [DisplayFormat(DataFormatString = "{0:yyyy-MM-ddTHH:mm}", ApplyFormatInEditMode = true)]
        [Required(ErrorMessage = "Obrigatório")]
        public DateTime Data { get; set; }
        public string Categoria { get; set; }
        [Required(ErrorMessage = "Obrigatório")]
        public string Descricao { get; set; }
        public decimal? Saldo { get; set; }
        public string? Usuario { get; set; }
        public DateTime? DataCreate { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsEntrada { get; set; }

        public IList<SelectListItem> ListaTipos { get; set; }
        public CreateMovimentacaoData() { }
        public CreateMovimentacaoData(List<TipoMovimentacao> tipos) 
        {
            ListaTipos = Listas.ListTipo(tipos);
            Data = DateTime.Now;
        }
        public CreateMovimentacaoData(Movimentacao movi, List<TipoMovimentacao> tipos) 
        {
            Id = movi.Id;
            Valor = movi.Valor;
            TipoId = movi.TipoId;
            Data = movi.Data;
            Categoria = movi.Categoria;
            Descricao = movi.Descricao;
            Saldo = movi.Saldo;
            Usuario = movi.Usuario;
            Data = movi.Data;
            DataCreate = movi.DataCreate;
            IsDeleted = movi.IsDeleted;
            ListaTipos = Listas.ListTipo(tipos, TipoId);
            IsEntrada = movi.IsEntrada;
        }

    }
}
