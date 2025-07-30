function initializeAutocomplete(inputSelector, url, hiddenInputSelector) {
	$(inputSelector).autocomplete({
		source: function (request, response) {
			$.ajax({
				url: url,
				data: { term: request.term },
				success: function (data) {
					response($.map(data, function (item) {
						return {
							label: item.text,
							value: item.text,
							id: item.id
						};
					}));
				},
				error: function () {
				}
			});
		},
		minLength: 1,
		select: function (event, ui) {
			$(inputSelector).val(ui.item.id);
			$(hiddenInputSelector).val(ui.item.id);
		},
		open: function () {
			$(".ui-autocomplete").css({
				"background-color": "#2c2c2c",
				"color": "#ffffff ",
				"z-index": "10050",
				"max-height": "250px",  
				"overflow-y": "auto",     
				"overflow-x": "hidden",  
			});
			$(".ui-menu-item").css("color", "#ffffff ");
			$(".ui-state-focus").css({
				"background-color": "#444",
				"color": "#ffffff ",
			});
		}
	});
	$(inputSelector).on("input", function () {
		if (!$(this).val()) {
			$(hiddenInputSelector).val("");
		}
	});
}
