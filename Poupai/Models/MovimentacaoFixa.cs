namespace Poupai.Models
{
    public class MovimentacaoFixa
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public int TipoMovimentacaoId { get; set; }
        public virtual TipoMovimentacao TipoMovimentacao { get; set; }
        public decimal Valor { get; set; }
        public int? DiaVencimento { get; set; }
        public DateTime? DataVencimento { get; set; }
        public DateTime? DataFim { get; set; }
        public DateTime? DataCreate { get; set; }
        public string? Categoria { get; set; }
        public string? FormaPagamento { get; set; }
        public string? Observacoes { get; set; }
        public bool Ativo { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsEntrada { get; set; }
        public bool Pago { get; set; }
        public DateTime? DataUltimoPagamento { get; set;}
    }
}
