function SaveMosaico(data, viewModel) {

	$.ajax({
		type: "POST",
		url: `${api}/api/Mosaico`,
		data: JSON.stringify(data),
		contentType: "application/json",
		success: function (data) {
			viewModel.notifier.success(viewModel.t('Успешно сохранено.'));
		},
		error: function (data) {
			viewModel.notifier.error(viewModel.t('Ошибка сохранения.'));
		},
		dataType: 'JSON'
	});  
}