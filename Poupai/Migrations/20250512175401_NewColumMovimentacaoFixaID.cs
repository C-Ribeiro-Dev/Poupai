using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Poupai.Migrations
{
    /// <inheritdoc />
    public partial class NewColumMovimentacaoFixaID : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MovimentacaoFixaId",
                table: "Movimentacoes",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MovimentacaoFixaId",
                table: "Movimentacoes");
        }
    }
}
