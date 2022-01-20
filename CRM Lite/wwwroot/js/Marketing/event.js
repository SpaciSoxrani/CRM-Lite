$(document).ready(function () {
	$('#is-recognizability').on("change", function () {
		if ($('#is-recognizability').prop('checked'))
			document.getElementById('recognizability').style.display = 'block';
		else
			document.getElementById('recognizability').style.display = 'none';
	})

	$('#is-need-formation').on("change", function () {
		if ($('#is-need-formation').prop('checked'))
			document.getElementById('need-formation').style.display = 'block';
		else
			document.getElementById('need-formation').style.display = 'none';
	})

	$('#is-increase-loyalty').on("change", function () {
		if ($('#is-increase-loyalty').prop('checked'))
			document.getElementById('increase-loyalty').style.display = 'block';
		else
			document.getElementById('increase-loyalty').style.display = 'none';
	})

	$('#is-market-research').on("change", function () {
		if ($('#is-market-research').prop('checked'))
			document.getElementById('market-research').style.display = 'block';
		else
			document.getElementById('market-research').style.display = 'none';
	})
});