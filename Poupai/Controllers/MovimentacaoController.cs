using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using Poupai.Data;
using Poupai.Models;
using Poupai.ViewModel.MovimentacaoViewModel;

namespace Poupai.Controllers
{
    public class MovimentacaoController : Controller
    {
        private ApplicationDbContext _db;
        public MovimentacaoController(ApplicationDbContext db)
        {
            _db = db;
        }
        public IActionResult Index()
        {
            var mov = _db.Movimentacoes.Where(x => x.IsDeleted != true).OrderByDescending(x => x.Data).ToList();
            var listTipo = _db.TiposMovimentacoes.ToList();

            var vm = mov.Select(x => new MovimentacaoData(x)).ToList();
            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("_Movimentacao", vm);
            }

            return View(vm);
        }
        #region CRUD
        public async Task<IActionResult> Create(MovimentacaoData movi)
        {
            var tipo = await _db.TiposMovimentacoes.ToListAsync();
            var vm = new CreateMovimentacaoData(tipo);

            return PartialView("_Create", vm);
        }
        [HttpPost]
        public IActionResult Create(CreateMovimentacaoData cMovi)
        {
            var tipo = _db.TiposMovimentacoes.First(x => x.Id == cMovi.TipoId);
            var vm = new Movimentacao
            {
                Descricao = cMovi.Descricao,
                TipoId = cMovi.TipoId,
                Data = cMovi.Data,
                Valor = cMovi.Valor,
                IsDeleted = false,
                DataCreate = DateTime.UtcNow,
                IsEntrada = tipo.IsEntrada,
            };

            _db.Movimentacoes.Add(vm);
            _db.SaveChanges();

            return Ok();
        }
        public async Task<IActionResult> Edit(int id)
        {
            var movi = await _db.Movimentacoes.FirstAsync(x => x.Id == id);
            var tipo = _db.TiposMovimentacoes.ToList();

            var vm = new CreateMovimentacaoData(movi, tipo);

            return PartialView("_Edit", vm);
        }
        [HttpPost]
        public async Task<IActionResult> Edit(CreateMovimentacaoData movi)
        {
            var vm = await _db.Movimentacoes.FirstAsync(x => x.Id == movi.Id);
            var tipo = _db.TiposMovimentacoes.First(x => x.Id == movi.TipoId);

            vm.Data = movi.Data;
            vm.Valor = movi.Valor;
            vm.IsDeleted = false;
            vm.Descricao = movi.Descricao;
            vm.Categoria = movi.Categoria;
            vm.TipoId = movi.TipoId;
            vm.Saldo = movi.Saldo;
            vm.Usuario = movi.Usuario;
            vm.IsEntrada = tipo.IsEntrada;

            await _db.SaveChangesAsync();
            return Ok();
        }
        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var movi = await _db.Movimentacoes.FirstAsync(x => x.Id == id);
            movi.IsDeleted = true;
            await _db.SaveChangesAsync();

            return Json(new { success = true, message = "Movimentação deletada com sucesso!" });
        }
        #endregion
    }
}
