using Poupai.Models;
using Poupai.ViewModel.MovimentacaoFixaViewModels;
using Poupai.ViewModel.MovimentacaoViewModel;

namespace Poupai.ViewModel.HomeViewModel
{
    public class HomeData
    {
        public string Saldo { get; set; }
        public decimal SaldoD { get; set; }
        public string Entradas { get; set; }
        public string Saidas { get; set; }
        public List<MovimentacaoData> Moviments { get; set; }
        public List<MovimentacaoFixaData> MovimentsFixas { get; set; }
        public string Mes { get; set; }


        public HomeData() { }
        public HomeData(List<MovimentacaoData> movs, List<MovimentacaoFixaData> movsFixa) 
         {
            Moviments = movs;
            MovimentsFixas = movsFixa;

            var entrada = movs.Where(x => x.IsEntrada == true).ToList();
            var saida = movs.Where(x => x.IsEntrada != true).ToList();
            var totalEntrada = entrada.Sum(x => x.Valor);
            var totalSaida = saida.Sum(x => x.Valor);

            var entradaFixa = movsFixa.Where(x => x.IsEntrada == true && !x.StatusPagamento.Contains("Não")).ToList();
            var saidaFixa = movsFixa.Where(x => x.IsEntrada != true && !x.StatusPagamento.Contains("Não")).ToList();
            var totalEntradaFixa = entradaFixa.Sum(x => x.ValorD);
            var totalSaidaFixa = saidaFixa.Sum(x => x.ValorD);

            Entradas = totalEntrada .ToString("N2");
            Saidas = totalSaida.ToString("N2");
            Saldo = (totalEntrada - totalSaida).ToString("N2");
            SaldoD = totalEntrada - totalSaida;
            Mes = DateTime.Now.ToString("MMMM", new System.Globalization.CultureInfo("pt-BR"));

        }
    }
}
