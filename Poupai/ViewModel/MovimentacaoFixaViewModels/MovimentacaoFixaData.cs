using Poupai.Models;
using Poupai.Servicos;

namespace Poupai.ViewModel.MovimentacaoFixaViewModels
{
    public class MovimentacaoFixaData
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public int TipoMovimentacaoId { get; set; }
        public virtual TipoMovimentacao TipoMovimentacao { get; set; }
        public string Valor { get; set; }
        public decimal ValorD { get; set; }
        public int DiaVencimento { get; set; }
        public string? DataVencimento { get; set; }
        public string? DataFim { get; set; }
        public string? DataCreate { get; set; }
        public string? Categoria { get; set; }
        public string? FormaPagamento { get; set; }
        public string? Observacoes { get; set; }
        public bool Ativo { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsEntrada { get; set; }
        public string EntraOuSaida { get; set; }
        public string Status { get; set; }
        public string StatusPagamento { get; set; }
        public string UltimoPagamento { get; set; }
        public string ProximoVencimento { get; set; }
        public bool IsPago {get; set;}
        public MovimentacaoFixaData() { }
        public MovimentacaoFixaData(MovimentacaoFixa movi)
        {
            Id = movi.Id;
            Nome = movi.Nome;
            TipoMovimentacaoId = movi.TipoMovimentacaoId;
            Valor = movi.Valor.ToString("N2");
            ValorD = movi.Valor;
            DiaVencimento = (int)movi.DiaVencimento;
            FormaPagamento = movi.FormaPagamento;
            EntraOuSaida = movi.IsEntrada == true ? "Entrada" : "Saída";
            IsEntrada = movi.IsEntrada;
            Categoria = movi.TipoMovimentacao.Nome;
            IsPago = movi.Pago;

            DateTime hoje = DateTime.Today;
            DateTime vencimento = Calculos.Vencimento(DiaVencimento);
            bool pagamentoNoMesVencimento = movi.DataUltimoPagamento.HasValue &&
                movi.DataUltimoPagamento.Value.Month == vencimento.Month &&
                movi.DataUltimoPagamento.Value.Year == vencimento.Year;
            if (!pagamentoNoMesVencimento)
            {
                StatusPagamento = "Não Pago";
            }
            else
            {
                StatusPagamento = movi.DataUltimoPagamento.Value <= vencimento
                    ? "Pago em Dia"
                    : "Pago com Atraso";
            }
            Status = hoje > vencimento && !pagamentoNoMesVencimento ? "Atrasada" : "Em Dia";
            DataVencimento = vencimento.ToString("dd/MM/yyyy");

            var dataVencimento = new DateTime(hoje.Year, hoje.Month, Math.Min(DiaVencimento, DateTime.DaysInMonth(hoje.Year, hoje.Month + 1))).AddMonths(1);
            ProximoVencimento = dataVencimento.ToString("dd/MM/yyyy");
            UltimoPagamento = movi.DataUltimoPagamento == null ? "--" : movi.DataUltimoPagamento.Value.ToString("dd/MM/yyyy");
        }
    }
}
