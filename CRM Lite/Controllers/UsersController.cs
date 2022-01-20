using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using CRM_Lite.Data;
using CRM_Lite.Data.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vostok.Logging.Abstractions;

namespace CRM_Lite.Controllers
{
    public class UsersController : Controller
    {
        private readonly ApplicationContext _context;
        private readonly IMapper _mapper;
        private readonly ILog _log;

        public UsersController
        (
            ApplicationContext context,
            IMapper mapper,
            ILog log)
        {
            _context = context;
            _mapper = mapper;
            _log = log;
        }
        
        [HttpGet("GetAllUsers")]
        public async Task<ActionResult<UserDto[]>> GetAllUsersAsync(CancellationToken cancellationToken)
        {
            var users = await _context.Users.ToArrayAsync(cancellationToken);

            return _mapper.Map<UserDto[]>(users);
        }
    }
}