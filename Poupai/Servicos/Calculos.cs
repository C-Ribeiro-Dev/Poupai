namespace Poupai.Servicos
{
    public class Calculos
    {
        public static DateTime Vencimento(int diaVencimento)
        {
            DateTime hoje = DateTime.Today;

            // Garante que o dia não ultrapasse o último dia do mês
            int diasNoMesAtual = DateTime.DaysInMonth(hoje.Year, hoje.Month);
            int diaSeguro = Math.Min(diaVencimento, diasNoMesAtual);
            DateTime vencimentoEsteMes = new DateTime(hoje.Year, hoje.Month, diaSeguro);

            // Se o vencimento passou para o mês seguinte
           

            return vencimentoEsteMes;
        }


    }
}
