using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Poupai.Migrations
{
    /// <inheritdoc />
    public partial class ADDNewTableMovimentacaofixa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MovimentacoesFixas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoMovimentacaoId = table.Column<int>(type: "int", nullable: false),
                    Valor = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DiaVencimento = table.Column<int>(type: "int", nullable: true),
                    DataVencimento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataFim = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataCreate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Categoria = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FormaPagamento = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Observacoes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsEntrada = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimentacoesFixas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimentacoesFixas_TiposMovimentacoes_TipoMovimentacaoId",
                        column: x => x.TipoMovimentacaoId,
                        principalTable: "TiposMovimentacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimentacoesFixas_TipoMovimentacaoId",
                table: "MovimentacoesFixas",
                column: "TipoMovimentacaoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovimentacoesFixas");
        }
    }
}
