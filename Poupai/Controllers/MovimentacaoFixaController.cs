using System.Drawing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Poupai.Data;
using Poupai.Models;
using Poupai.ViewModel.MovimentacaoFixaViewModels;

namespace Poupai.Controllers
{
    public class MovimentacaoFixaController : Controller
    {
        private ApplicationDbContext _db;
        public MovimentacaoFixaController(ApplicationDbContext db)
        {
            _db = db;

        }
        public IActionResult Index()
        {
            var moviFixa = _db.MovimentacoesFixas.Where(x => x.IsDeleted != true).Include(x => x.TipoMovimentacao).OrderBy(x => x.DiaVencimento).ToList();

            var vm = moviFixa.Select(x => new MovimentacaoFixaData(x)).ToList();
            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("_MovimentacaoFixa", vm);
            }
            return View(vm);
        }
        public async Task<IActionResult> Create()
        {
            var tipoMovimentacao = await _db.TiposMovimentacoes.ToListAsync();
            var vm = new CreateMovimentacaoFixaData(tipoMovimentacao);

            return PartialView("_Create", vm);
        }
        [HttpPost]
        public async Task<IActionResult> Create(CreateMovimentacaoFixaData data)
        {
            try
            {
                decimal valor = Convert.ToDecimal(data.ValorS);
                int tipoId = Convert.ToInt32(data.TipoMovimentacaoId);
                var vm = new MovimentacaoFixa
                {
                    Nome = data.Nome ?? "--",
                    TipoMovimentacaoId = tipoId,
                    Valor = valor,
                    DiaVencimento = data.DiaVencimento,
                    DataCreate = DateTime.UtcNow,
                    FormaPagamento = data.FormaPagamento,
                    IsEntrada = data.IsEntrada,
                };

                await _db.MovimentacoesFixas.AddAsync(vm);
                await _db.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao salvar: {ex.Message}");
            }
        }
        public async Task<IActionResult> UpDatePagamento(int id)
        {
            var moviFix = await _db.MovimentacoesFixas.FirstAsync(x => x.Id == id);
            var tipoMovi = await _db.TiposMovimentacoes.ToListAsync();
            var vm = new CreateMovimentacaoFixaData(moviFix, tipoMovi);

            return PartialView("_UpdatePagamento", vm);
        }
        [HttpPost]
        public async Task<IActionResult> UpDatePagamento(CreateMovimentacaoFixaData movi)
        {
            var moviFix = await _db.MovimentacoesFixas.FirstOrDefaultAsync(x => x.Id == movi.Id);
            if (moviFix == null) return NotFound();
            decimal valor = Convert.ToDecimal(movi.ValorS);
            moviFix.DataUltimoPagamento = movi.DataPagamento;
            moviFix.Pago = true;
            moviFix.FormaPagamento = movi.FormaPagamento;
            moviFix.Valor = valor;
            _db.SaveChanges();

            var moviDaly = new Movimentacao
            {
                Descricao = moviFix.Nome,
                TipoId = moviFix.TipoMovimentacaoId,
                Data = movi.DataPagamento ?? DateTime.Now,
                Valor = moviFix.Valor,
                IsDeleted = false,
                DataCreate = DateTime.UtcNow,
                IsEntrada = moviFix.IsEntrada,
                IsFixaOuDiaria = true,
                MovimentacaoFixaId = moviFix.Id,
            };
            _db.Movimentacoes.Add(moviDaly);
            _db.SaveChanges();
            return Ok();
        }
        public async Task<IActionResult> Edit(int id)
        {
            var moviFix = await _db.MovimentacoesFixas.FirstAsync(x => x.Id == id);
            var tipoMovi = _db.TiposMovimentacoes.ToList();
            var vm = new CreateMovimentacaoFixaData(moviFix, tipoMovi);
            return PartialView("_Edit", vm);
        }
        [HttpPost]
        public async Task<IActionResult> Edit(CreateMovimentacaoFixaData data)
        {
            try
            {
                var moiFix = await _db.MovimentacoesFixas.FirstAsync(x => x.Id == data.Id);
                decimal valor = Convert.ToDecimal(data.ValorS);
                int tipoId = Convert.ToInt32(data.TipoMovimentacaoId);

                moiFix.Nome = data.Nome ?? "--";
                moiFix.TipoMovimentacaoId = tipoId;
                moiFix.Valor = valor;
                moiFix.DiaVencimento = data.DiaVencimento;
                moiFix.IsEntrada = data.IsEntrada;


                _db.MovimentacoesFixas.Update(moiFix);
                _db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao salvar: {ex.Message}");
            }
        }
        public async Task<IActionResult> Delete(int id)
        {
            var moviFix = await _db.MovimentacoesFixas.FirstAsync(x => x.Id == id);
            var tipoMovi = _db.TiposMovimentacoes.ToList();

            var vm = new CreateMovimentacaoFixaData(moviFix, tipoMovi);

            return PartialView("_Delete", vm);
        }
        [HttpPost]
        public async Task<IActionResult> Delete(CreateMovimentacaoFixaData data)
        {
            var moiFix = await _db.MovimentacoesFixas.FirstAsync(x => x.Id == data.Id);
            moiFix.IsDeleted = true;
            _db.SaveChanges();
            return Ok();
        }
        public async Task<IActionResult> VerificarNome(string nome, int? id)
        {
            var query = _db.MovimentacoesFixas.AsQueryable();

            if (id.HasValue)
            {
                query = query.Where(p => p.Id != id.Value);
            }

            var existe = await query.AnyAsync(p => p.Nome == nome);

            if (existe)
            {
                return Json($"Uma Movimentação com o nome '{nome}' já existe");
            }

            return Json(true); 
        }
    }
}
