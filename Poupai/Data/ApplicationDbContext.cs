using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Poupai.Models;

namespace Poupai.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

        public DbSet<Movimentacao> Movimentacoes { get; set; }
        public DbSet<TipoMovimentacao> TiposMovimentacoes{ get; set; }
        public DbSet<MovimentacaoFixa> MovimentacoesFixas { get; set; }
    }
}