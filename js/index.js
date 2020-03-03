'use strict';

// begin pwa install stuff

let installPrompt = null;
let timeInput = '1'; // input from text field
let running = false; // whether or not it is running
let interval; // the interval in ms
let startTime; // moment from when it was started
let clickCount; // how many clicks have happened
let runningTime; // moment that keeps getting updated
let mnTimeout; // timeout id

window.addEventListener('beforeinstallprompt', function(e) {
	installPrompt = e;
	$('#installButton').parent().show();
});

window.addEventListener('appinstalled', function(e) {
	hideInstallOption(true);
});

function hideInstallOption(installed) {
	if (installed) {
		$('#installButton').parent().hide();
	}
	if ($('#installModal:visible').length > 0) {
		closeModal(function() {hideInstallOption2(installed);});
	} else {
		hideInstallOption2(installed);
	}
}

function hideInstallOption2(installed) { // the part that may or may not occur after closing the modal
	$('#installConfirmButton').hide();
	if (!installed) {$('#installModal p').html('Please <a href="index.html">reload the page</a> to install the web app.');}
}

// end pwa install stuff

$(document).ready(function() {
	// add events
	// android back button stuff
	if (window.matchMedia('(display-mode: standalone)').matches && navigator.userAgent.toLowerCase().indexOf('android') > -1) {
		if (window.history.scrollRestoration) {window.history.scrollRestoration = 'manual';}
		
		// to do history stuff (for android back button)
		$(window).on('popstate', function(e) {
			window.history.pushState({}, '');
			if ($('.modal:visible').length > 0) {
				closeModal();
			} else {
				//openModal('#closeAppModal');
				toast('Use a different feature to leave the app', 3000);
			}
		});
		window.history.pushState({}, '');
		
		/*
		$('#closeAppButton').on('click', function(e) {
			// somehow manage to close the app
		});
		*/
	}
	// to open the install modal
	$('#installButton').on('click', function(e) {openModal('#installModal');});
	// to show the install prompt (pwa)
	$('#installConfirmButton').on('click', function(e) {
		installPrompt.prompt();
		hideInstallOption(false);
		installPrompt.userChoice.then(function(choice) {
			if (choice.outcome == 'accepted') {hideInstallOption(true);}
			installPrompt = null;
		});
	});
	// time input behavior
	$('#timeInput').on('input', function(e) {
		let newInput = $(this).val();
		if (!validateNumberInput(newInput, {})) {
			let p = $(this)[0].selectionStart - (newInput.length - timeInput.length);
			$(this).val(timeInput);
			$(this)[0].setSelectionRange(p, p);
		} else {
			timeInput = newInput;
		}
	});
	$('#timeInput').on('change', function(e) {
		if (Number(timeInput) > 0) {
			timeInput = trimNumberStr(timeInput);
			$(this).val(timeInput);
		} else {
			timeInput = '1';
			$(this).val('1');
		}
	});
	$('#timeInput').on('focus', function(e) {$('#timeInput').select();});
	// unit button behavior
	$('#unitButton').on('click', function(e) {
		let units = ['s/click', 'click/s'];
		let index = units.indexOf($(this).text()) + 1;
		if (index >= units.length) {index = 0;}
		$(this).text(units[index]);
	});
	// start/stop button behavior
	$('#startStopButton').on('click', function(e) {startStop(!running);});
	// to open the menu modal
	$('#menuButton').on('click', function(e) {openModal('#menuModal');});
	
	$('#menuButton').attr('disabled', false);
	$('.hideWithoutJs').removeClass('hideWithoutJs');
});

function startStop(which) {
	running = which;
	if (!running) {clearTimeout(mnTimeout);}
	$('#startStopButton').html(running ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-play"></i>');
	$('#timeInput, #unitButton').attr('disabled', running);
	$('#details').css('color', running ? 'inherit' : 'gray');
	$('#visual').removeClass();
	if (running) {
		let unit = $('#unitButton').text();
		switch (unit) {
			case 's/click':
				interval = Number(timeInput) * 1000;
				break;
			case 'click/s':
				interval = (1 / Number(timeInput)) * 1000;
				break;
		}
		clickCount = 0;
		$('#detailClicks').text('0');
		$('#detailTime').text('00:00.000');
		$('#visual').addClass('visual-left');
		window.getSelection().removeAllRanges();
		startTime = moment();
		mnTimeout = setTimeout(updateTimer, 1);
	} else {
		$('audio')[0].pause();
	}
}

function updateTimer() {
	let ms = moment().diff(startTime);
	runningTime = moment.duration(ms);
	let tempClickCount = Math.floor(ms / interval);
	if (tempClickCount > clickCount) {
		$('audio')[0].currentTime = 0;
		$('audio')[0].play();
		clickCount = tempClickCount;
		$('#detailClicks').text(clickCount);
		$('#visual').removeClass().addClass(clickCount % 2 == 0 ? 'visual-left' : 'visual-right');
	}
	$('#detailTime').text(formatDuration(runningTime));
	mnTimeout = setTimeout(updateTimer, 1);
}

function formatDuration(duration) {
	let s = padNumber(duration.minutes(), 2) + ':' + padNumber(duration.seconds(), 2) + '.' + padNumber(duration.milliseconds(), 3);
	if (duration.asHours() >= 1) {s = padNumber(duration.hours(), 2) + ':' + s;}
	if (duration.asDays() >= 1) {s = Math.floor(duration.asDays()).toString() + 'd ' + s;}
	return s;
}

// don't use with decimals
function padNumber(n, length) {
	let s = n.toString();
	while (s.length < length) {s = '0' + s;}
	return s;
}

function validateNumberInput(s, properties) {
	if (properties.allowNegative && s[0] == '-') {s = s.substring(1);}
	let dpPos = s.indexOf('.');
	if (dpPos > -1) {s = s.substring(0, dpPos) + s.substring(dpPos + 1);}
	for (let i = 0; i < s.length; i++) {
		let charCode = s.charCodeAt(i);
		if (charCode < 48 || charCode > 57) {return false;}
	}
	return true;
}

// validate first
function trimNumberStr(s) {
	let isNegative = false;
	if (s[0] == '-') {
		isNegative = true;
		s = s.substring(1);
	}
	while (s[0] == '0') {s = s.substring(1);}
	if (s.indexOf('.') > -1) {
		while (s[s.length - 1] == '0') {s = s.substring(0, s.length - 1)}
		if (s[s.length - 1] == '.') {s = s.substring(0, s.length - 1)}
		if (s[0] == '.') {s = '0' + s;}
	}
	if (isNegative) {s = '-' + s;}
	return s;
}