namespace Poupai.Models
{
    public class TipoMovimentacao
    {
        public int Id { get; set; }

        // Nome do tipo: Exemplo "Entrada", "Saída", "Troco", "Pagamento"
        public string Nome { get; set; }

        // Se é entrada ou saída (útil para lógica)
        public bool IsEntrada { get; set; }

        // Descrição opcional
        public string? Descricao { get; set; }
    }
}
