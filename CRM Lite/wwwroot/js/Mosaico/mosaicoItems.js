$(document).ready(function () {
	let content = $('#items');
	$.ajax({
		url: `${api}/api/Mosaico`,
		success: function (data) {
			for (i = 0; i < data.length; i++) {
				ahref = "/Mosaico/Editor/" + data[i].name + '/' + data[i].template + '/' + data[i].id;
				content.append("<tr>	<td>" + data[i].name + "</td> <td><a class=\"btn btn-primary\" style=\"justify-content:flex-start; color:white; margin: 10px 0px 10px 0px;\" href=\"" + ahref +"\">Редактировать</a></td>	</tr>");
			}
		}
	});
});
