using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Poupai.Migrations
{
    /// <inheritdoc />
    public partial class NewCollumMovimentacaoFixa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataUltimoPagamento",
                table: "MovimentacoesFixas",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Pago",
                table: "MovimentacoesFixas",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataUltimoPagamento",
                table: "MovimentacoesFixas");

            migrationBuilder.DropColumn(
                name: "Pago",
                table: "MovimentacoesFixas");
        }
    }
}
