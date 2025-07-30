using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Poupai.Data;
using Poupai.Models;
using Poupai.ViewModel.TipoMovimentacaoViewModel;

namespace Poupai.Controllers
{
    public class TipoMovimentacaoController : Controller
    {
        private ApplicationDbContext _db;
        public  TipoMovimentacaoController(ApplicationDbContext db)
        {
            _db = db;
        }
        public IActionResult Index()
        {
            var tipoMov = _db.TiposMovimentacoes.ToList();

            var vm = tipoMov.Select(x => new TipoMovimentacaoData(x)).ToList();

            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("_TipoMovimentacao", vm);
            }
           
            return View(vm);
        }
        public async Task<IActionResult> Create()
        {
            var vm = new TipoMovimentacaoData();
            return PartialView("_Create");
        }
        [HttpPost]
        public async Task<IActionResult> Create(TipoMovimentacaoData tipo) 
        {
            var vm = new TipoMovimentacao()
            {
                Nome = tipo.Nome,
                Descricao = tipo.Descricao,
                IsEntrada = tipo.IsEntrada
            };
            await _db.TiposMovimentacoes.AddAsync(vm);
            await _db.SaveChangesAsync();
            return Ok();

        }
        public async Task<IActionResult> VerificarTipoName(string Nome, int? id)
        {
            var query = _db.TiposMovimentacoes.AsQueryable();

            if (id.HasValue)
            {
                query = query.Where(p => p.Id != id.Value);
            }

            var existe = await query.AnyAsync(p => p.Nome == Nome);

            if (existe)
            {
                return Json($"Um Tipo de Movimentação com o nome '{Nome}' já existe");
            }

            return Json(true); // Validação passou (não existe outro com o mesmo nome)
        }
    }
}
