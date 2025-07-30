using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Poupai.Data;
using Poupai.Models;
using Poupai.ViewModel.MovimentacaoViewModel;
using Poupai.ViewModel;
using Poupai.ViewModel.HomeViewModel;
using Microsoft.EntityFrameworkCore;
using Poupai.ViewModel.MovimentacaoFixaViewModels;

namespace Poupai.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private ApplicationDbContext _db;
        public HomeController(ILogger<HomeController> logger, ApplicationDbContext db)
        {
            _logger = logger;
            _db = db;
        }
        public IActionResult Index()
        {
            DateTime hoje = DateTime.Now;
            DateTime inicioDoMes = new DateTime(hoje.Year, hoje.Month, 1);
            DateTime fimDoMes = inicioDoMes.AddMonths(1).AddDays(-1);

            var mov = _db.Movimentacoes
                .Where(x => x.Data >= inicioDoMes && x.Data <= fimDoMes && x.IsDeleted != true)
                .Include(x => x.Tipo)
                .OrderByDescending(x => x.Data)
                .ToList();
            var movi = mov.Select(x => new MovimentacaoData(x)).ToList();
            
            var movFixa = _db.MovimentacoesFixas.Where(x => x.IsDeleted != true)
                .Include(x => x.TipoMovimentacao)
                .OrderBy(x => x.Pago)
                .ToList();
            var moviFixa = movFixa.Select(x => new MovimentacaoFixaData(x)).ToList();


            var vm = new HomeData(movi, moviFixa);
            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("_Movimentacoes", vm);
            }
            return View(vm);
        }
        public IActionResult Privacy()
        {
            return View();
        }
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
