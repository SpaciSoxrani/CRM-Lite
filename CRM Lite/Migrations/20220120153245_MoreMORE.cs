using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Lite.Migrations
{
    public partial class MoreMORE : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PreSaleGroupStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreSaleGroupStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PreSaleRegions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Timezone = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreSaleRegions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PreSaleResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreSaleResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PreSaleStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreSaleStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ParentDepartmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    ManagerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ManagerFromAD = table.Column<Guid>(type: "uuid", nullable: true),
                    CanSell = table.Column<bool>(type: "boolean", nullable: false),
                    CanProduct = table.Column<bool>(type: "boolean", nullable: false),
                    CanExecute = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Departments_Departments_ParentDepartmentId",
                        column: x => x.ParentDepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PreSaleGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    StatusId = table.Column<Guid>(type: "uuid", nullable: true),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ChangedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsVisible = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreSaleGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreSaleGroups_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PreSaleGroups_PreSaleGroupStatuses_StatusId",
                        column: x => x.StatusId,
                        principalTable: "PreSaleGroupStatuses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    Login = table.Column<string>(type: "text", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PreSales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Organization = table.Column<string>(type: "text", nullable: true),
                    FullName = table.Column<string>(type: "text", nullable: true),
                    JobTitle = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Site = table.Column<string>(type: "text", nullable: true),
                    RequestSent = table.Column<string>(type: "text", nullable: true),
                    IncomingNumber = table.Column<string>(type: "text", nullable: true),
                    ExecutorContact = table.Column<string>(type: "text", nullable: true),
                    Comments = table.Column<string>(type: "text", nullable: true),
                    ResultComments = table.Column<string>(type: "text", nullable: true),
                    RegionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResponsibleUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    DayAppointment = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StatusId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResultId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ChangedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreSales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreSales_PreSaleGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "PreSaleGroups",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PreSales_PreSaleRegions_RegionId",
                        column: x => x.RegionId,
                        principalTable: "PreSaleRegions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PreSales_PreSaleResults_ResultId",
                        column: x => x.ResultId,
                        principalTable: "PreSaleResults",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PreSales_PreSaleStatuses_StatusId",
                        column: x => x.StatusId,
                        principalTable: "PreSaleStatuses",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PreSales_Users_ResponsibleUserId",
                        column: x => x.ResponsibleUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Departments_ManagerId",
                table: "Departments",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_ParentDepartmentId",
                table: "Departments",
                column: "ParentDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PreSaleGroups_DepartmentId",
                table: "PreSaleGroups",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PreSaleGroups_StatusId",
                table: "PreSaleGroups",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_PreSales_GroupId",
                table: "PreSales",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_PreSales_RegionId",
                table: "PreSales",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_PreSales_ResponsibleUserId",
                table: "PreSales",
                column: "ResponsibleUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PreSales_ResultId",
                table: "PreSales",
                column: "ResultId");

            migrationBuilder.CreateIndex(
                name: "IX_PreSales_StatusId",
                table: "PreSales",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_DepartmentId",
                table: "Users",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Departments_Users_ManagerId",
                table: "Departments",
                column: "ManagerId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Departments_Users_ManagerId",
                table: "Departments");

            migrationBuilder.DropTable(
                name: "PreSales");

            migrationBuilder.DropTable(
                name: "PreSaleGroups");

            migrationBuilder.DropTable(
                name: "PreSaleRegions");

            migrationBuilder.DropTable(
                name: "PreSaleResults");

            migrationBuilder.DropTable(
                name: "PreSaleStatuses");

            migrationBuilder.DropTable(
                name: "PreSaleGroupStatuses");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Departments");
        }
    }
}
