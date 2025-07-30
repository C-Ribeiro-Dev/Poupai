using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Poupai.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace Poupai.ViewModel.TipoMovimentacaoViewModel
{
    public class TipoMovimentacaoData
    {
        public int Id { get; set; }
        [Required(ErrorMessage ="Obrigatório")]
        [Remote("VerificarTipoName", "TipoMovimentacao", AdditionalFields = "Id")]
        public string Nome { get; set; }
        public bool IsEntrada { get; set; }
        public string? Descricao { get; set; }
        public string Tipo { get; set; }
        public TipoMovimentacaoData() { }
        public TipoMovimentacaoData(TipoMovimentacao t)
        {
            Nome = t.Nome;
            Descricao = t.Descricao == null ? "--" : t.Descricao;
            Tipo = t.IsEntrada == true ? "Entrada" : "Saída";
        }
    }
}
