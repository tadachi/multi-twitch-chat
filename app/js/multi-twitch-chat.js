/* Similar to what you find in Java's format. */
/* Usage: chatsrc = 'https://twitch.tv/chat/embed?channel={channel}&amp;popout_chat=true'.format({ channel: streamer}); */
if (!String.prototype.format) {
	String.prototype.format = function() {
		var str = this.toString();
		if (!arguments.length)
			return str;
		var args = typeof arguments[0],
			args = (('string' == args || 'number' == args) ? arguments : arguments[0]);
		for (arg in args)
			str = str.replace(RegExp('\\{' + arg + '\\}', 'gi'), args[arg]);
		return str;
	}
}

function AutoInteger(count, min, max) {
    this.count = count;
    this.min = min;
    this.max = max;
}

AutoInteger.prototype.inc = function() {
    if ( (this.count+1) > this.max ) {
        this.count = this.min
    } else {
        this.count++;
    }
}
AutoInteger.prototype.dec = function() {
    if ( (this.count-1) < this.min ) {
        this.count = this.min;
    } else {
        this.count--;
    }
}

// Bootstrap the application. and add the very important compile module.
var app = angular.module('app', ['ngSanitize', 'ngStorage'], ['$compileProvider', function($compileProvider) {
$compileProvider.directive('myCompileUnsafe', ['$compile', function($compile) {
	return function(scope, element, attrs) {
	scope.$watch(
			function(scope) {
				// watch the 'compile' expression for changes
				return scope.$eval(attrs.myCompileUnsafe);
			},
			function(value) {
				// when the 'compile' expression changes
				// assign it into the current DOM element
				element.html(value);

				// compile the new DOM and link it to the current
				// scope.
				// NOTE: we only compile .childNodes so that
				// we don't get into infinite loop compiling ourselves
				$compile(element.contents())(scope);
			}
			);
		};
	}]);
}]);


app.controller('MainController', function($scope,$location,$localStorage) {
	$scope.searchtext = '';
	$scope.searchresults = [];

	$scope.storage = $localStorage.$default({
		savedstreamers: []
	});

	$scope.savedstreamers = $scope.storage.savedstreamers;
});

// Make directive draggable.
app.directive('draggable', function() {
	return {
		restrict: 'AEC',
		link: function($scope, $element) {
			$element.draggable({
				containment: '#center',
				stack: '.set'
			});
		}
	};
});

// Handles images point to wrong url
app.directive('errSrc', function() {
	return {
		link: function($scope, $element, $attrs) {

			$scope.$watch(function() { return $attrs['ngSrc']; },
			function (value) {
				if (!value) {
					$element.attr('src', $attrs.errSrc);
				}
			});

			$element.bind('error', function() {
				$element.attr('src', $attrs.errSrc);
			});
		}
	}
});

// On refresh, loads streams from previous session.
app.directive('loadChat', ['$compile', function($compile) {
	return {
		restrict: 'AEC',
		scope: {
			insertionpoint: '@',
			savedstreamers: '='
		},
		controller: function($scope) {
            $scope.res = calcResolutions();
            $scope.colors = [ 'LightSteelBlue ','Snow','AliceBlue','Azure'];
            $scope.autoInt = new AutoInteger(0, 0, $scope.colors.length);
            width = Math.floor(($scope.res.centerW-20)/4); // 20 is the width of a scroll bar.
            height = Math.floor($scope.res.centerH/2);

			$scope.add = function(insertionpoint, stream) {

				// Source(src) of the chat with streamname.
				var chatsrc = 'https://twitch.tv/chat/embed?channel={ch}&amp;popout_chat=true'.format({
					ch: stream.streamname});

				// iframe of the chat goes into a twitchchat div that's draggable.
				var chat =    [ '<iframe ',
					'id=\'_{name}\' '.format({ name: stream.streamname}),
					'frameborder=\'0\' ',
					'scrolling=\'yes\' ',
					'src=\'{url}\' '.format({url: chatsrc}),
					'width=\'{w}\' '.format({w: width-40}),
					'height=\'{h}\' '.format({h: height-40}),
					'> ',
				'</iframe>'].join('');

                color = $scope.colors[$scope.autoInt.count];
                $scope.autoInt.inc();

                var html = ["<div class='set {uid} twitch-chat' style='background-color: {color}; width: {w}px; height: {h}px;' draggable>".format({color: color, uid: stream.streamname, w: width, h: height}),
							"<span style='position: absolute; margin: 20px 0px 0px 20px;'>{chat}</span>".format({chat: chat}),
							"<img ng-src='{logo}' class='topcornerlogo' width='50' height='50' err-src='img/twitchchat.jpg'>".format({logo: stream.logo}),
							"</div>"
							].join(''); //Html from above all together.

				// Compile html with angular.
				var compiledhtml = $compile(html)($scope);

				// Append the compiled html(chat) to insertionpoint
				$('#'+insertionpoint).append(compiledhtml);
			}

			// Load all the saved chats from session.
			for (i = 0; i < $scope.savedstreamers.length; i++) {
				$scope.add($scope.insertionpoint, $scope.savedstreamers[i]);
			}
		}
	};
}]);

// Creates multiple from clicking streams from search.
app.directive('multiChat', ['$compile', function($compile) {
	return {
		restrict: 'AEC',
		scope: {
			insertionpoint: '@',
			streamname: '@',
			logo: '@',
			savedstreamers: '='
		},
		link: function($scope, $element) {
            $scope.res = calcResolutions();
            $scope.colors = [ 'LightSteelBlue ','Snow','AliceBlue','Azure'];
            $scope.autoInt = new AutoInteger(0, 0, $scope.colors.length);
            width = Math.floor(($scope.res.centerW-20)/4); // 20 is the width of a scroll bar.
            height = Math.floor($scope.res.centerH/2);

			$element.bind('click', function(e) {
				console.log($scope.logo);
				var stream = { streamname: $scope.streamname, logo: $scope.logo };

				if ($scope.savedstreamers.length >= 8) { // Set a maximum number of streams allowed opened.
					return -1;
				}

				// Do not allow duplicate streams. (Note: this is pretty slow as it has go through whole array to find a duplicate.)
				for (i = 0; i < $scope.savedstreamers.length; i++) {
					console.log($scope.savedstreamers[i]);
					if (stream.streamname == $scope.savedstreamers[i].streamname) {
						console.log('match found: ' + $scope.savedstreamers[i].streamname + ' - will not be added to session.');
						return -1;
					}
				};

				// Add chat to session array to keep track of it.
				$scope.$apply(function() {
					$scope.savedstreamers.push(stream);
				});

				// Add chat to insertionpoint.
				$scope.add($scope.insertionpoint, stream);
			});

			$scope.add = function(insertionpoint, stream) {
				// Source(src) of the chat with streamname.
				var chatsrc = 'https://twitch.tv/chat/embed?channel={ch}&amp;popout_chat=true'.format({
					ch: stream.streamname});

				// iframe of the chat.
				var chat =    [ '<iframe ',
					'id=\'_{name}\' '.format({ name: stream.streamname}),
					'frameborder=\'0\' ',
					'scrolling=\'yes\' ',
					'src=\'{url}\' '.format({url: chatsrc}), //'src=\'{url}\' '.format({url: 'test'}),
					'width=\'{w}\' '.format({w: width-40}),
					'height=\'{h}\' '.format({h: height-40}),
					'draggable> ',
				'</iframe>'].join('');

                color = $scope.colors[$scope.autoInt.count];
                $scope.autoInt.inc();

                var html = ["<div class='set {uid} twitch-chat' style='background-color: {color}; width: {w}px; height: {h}px;' draggable>".format({color: color, uid: stream.streamname, w: width, h: height}),
							"<span style='position: absolute; margin: 20px 0px 0px 20px;'>{chat}</span>".format({chat: chat}),
							"<img ng-src='{logo}' class='topcornerlogo' width='50' height='50' err-src='img/twitchchat.jpg'>".format({logo: stream.logo}),
							"</div>"
							].join(''); //Html from above all together.

				console.log($('.' + stream.streamname));
				var compiledhtml = $compile(html)($scope);

				$('#'+insertionpoint).append(compiledhtml);

				applyResolutions();
			}
		}
	};
}]);

app.directive('manageChats', ['$compile', function($compile) {
	return {
		restrict: 'AEC',
		controller: 'MainController',
		link: function($scope, $element, $attrs) {

			$scope.closeChat = function(stream) {
				/* Remove div with a uid inside its class */
				// $('.' + stream.streamname).effect('fade', {}, 350, function() { //streamname is the uid.
				//     $('.' + stream.streamname).remove();
				// });
				$('.' + stream.streamname).effect('fade', {}, 350, function() { //streamname is the uid.
					console.log('test');
					//$('#_' + stream.streamname).contentWindow.location.reload();
					//document.getElementById('_' + stream.streamname).contentWindow.location.reload(true);
					$('#_' + stream.streamname).empty();
					$('.' + stream.streamname).empty();
					setTimeout(function(){
						$('.' + stream.streamname).remove();
						$('#_' + stream.streamname).remove();
					}, 1500)

				});

				var index = $scope.savedstreamers.indexOf(stream);

				if (index != -1) {
					$scope.savedstreamers.splice(index, 1); //Remove the streamer from session.
				}
			};
		}
	};
}]);

app.directive('twitchSearch', ['$compile', function($compile){
	return {
		restrict: 'AEC',
		controller: 'MainController',
		link: function($scope, $element, $attrs) {
			$scope.search = function(streamname) {
				$.ajax({
					url: 'https://api.twitch.tv/kraken/search/channels?q={streamname}'.format({ streamname: streamname}),

					// The name of the callback parameter, as specified by the YQL service.
					jsonp: "callback",

					// Tell jQuery we're expecting JSONP.
					dataType: "jsonp",

					success: function( response ) {
						$scope.$apply(function() {
							$scope.searchresults = response.channels;
						});

						console.log( response ); // server response
					}
				});
			}

			// $element.bind('propertychange keyup paste', function(blurEvent) {
			//     setTimeout($scope.search($element.val()), 0);
			// });
			$element.typing({
				start: function (event, $elem) {

				},
				stop: function (event, $elem) {
					$scope.search($element.val());
				},
				delay: 350
			});
		}
};
}]);

// Generate width height for various divs.
function calcResolutions() {
	hOffset = 32; //Height for our header
	currWinWidth = $(window).width();
	currWinHeight = $(window).height();

	headerWidth = Math.floor(currWinWidth);
	headerHeight = Math.floor(hOffset);

	containerWidth = (currWinWidth);
	containerHeight = (currWinHeight);

	centerWidth = Math.floor(currWinWidth - 250);
	centerHeight = Math.floor(currWinHeight);

	searchTwitchFormWidth = Math.floor(250);
	searchTwitchFormHeight = Math.floor(currWinHeight);

	return {
		containerW: containerWidth, containerH: containerHeight,
		headerW: headerWidth, headerH: headerHeight,
		centerW: centerWidth, centerH: centerHeight,
		searchTwitchFormW: searchTwitchFormWidth, searchTwitchFormH: searchTwitchFormHeight
	};
}

// Apply panel resolutions based on current window sizes to various divs.
function applyResolutions() {
	res = calcResolutions();

	$('#container').css('width', res.containerW);
	$('#container').css('height', res.containerH);

	$('#header').css('width',res.headerW);
	$('#header').css('height',res.headerH);

	$('#center').css('width', res.centerW);
	$('#center').css('height', res.centerH);

	$('#search-twitch-form').css('width', res.searchTwitchFormW);
	$('#search-twitch-form').css('height', res.searchTwitchFormH);

	$('#saved-chat-list').css('width', res.searchTwitchFormW);
	$('#saved-chat-list').css('height', res.searchTwitchFormH);

	/* Header */
	//$('#chatListButton').css('margin-left', 72); //Align image to far right properly.
	//// $('#showSearch').css('margin-left', 20); //Align image to far right properly.
	//$('#copyright').css('margin-left', res.headerW-120);
	//$('#srlplayer').css('margin-left', 260); //Align to far right properly.
}

function toggleSavedChatList() {
    $('#saved-chat-list').toggle();
}

/* Main */
$( document ).ready(function() {
	applyResolutions(); // Apply panel resolutions based on current window sizes

    $("#chat-list-button").click(function() {
        $("#saved-chat-list").toggle();
    })

	$( window ).resize(function() {
		applyResolutions();
	});

    /************ Twitch login button logic ***********/
    $('.twitch-connect').click(function() {
        Twitch.login({
            scope: ['user_read', 'channel_read']
        });
    })

    if (status.authenticated) {
        // Already logged in, hide button.
        $('.twitch-connect').hide()
    }
});
