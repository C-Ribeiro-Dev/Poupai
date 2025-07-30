using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Poupai.Migrations
{
    /// <inheritdoc />
    public partial class NewCollumMovimentacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataCreate",
                table: "Movimentacoes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Movimentacoes",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataCreate",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Movimentacoes");
        }
    }
}
