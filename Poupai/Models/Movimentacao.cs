namespace Poupai.Models
{
    public class Movimentacao
    {
        public int Id { get; set; }
        public decimal? Valor { get; set; }
        public int? TipoId { get; set; }
        public virtual TipoMovimentacao Tipo { get; set; }
        public DateTime Data { get; set; }
        public string? Categoria { get; set; }
        public string? Descricao { get; set; }
        public decimal? Saldo { get; set; }
        public string? Usuario { get; set; }
        public DateTime? DataCreate { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsEntrada { get; set; }
        public bool IsFixaOuDiaria {get; set;}
        public int? MovimentacaoFixaId {get; set;}
    }
}
