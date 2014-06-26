            <script>
                var autocompletestreamlist=[];
                var refreshSearchResultsId;
                var streamnames = $('input#streamnames').val();

                $('#streamnames').on('change', function() {
                    streamnames = $('input#streamnames').val();
                    search(streamnames);
                });

                $("input#submit").click(function() {
                    streamnames = $('input#streamnames').val();

                    search(streamnames);
                });

                $('#streamnames').focus(function() {
                    refreshSearchResultsId = setInterval(function() {
                        search(streamnames);
                    },5000);
                });

                $('#streamnames').focusout(function() {
                    clearInterval(refreshSearchResultsId);
                });
//                 setInterval(function() {
//                     search(streamnames);
//                 },10000);
//                 $(function() {
//                      $('#streamnames').autocomplete({
//                         source: function(request, response) {
//                             $.ajax({
//                                 url: 'https://api.twitch.tv/kraken/search/channels?q={streamnames}'.format({ streamnames: streamnames}),
//                                 dataType: 'jsonp',
//                                 data: {
//                                     featureClass: "P",
//                                     style: "full",
//                                     maxRows: 12,
//                                 }

//                             });
//                         }
//                     });
//                 })
                function search(streamnames) {
                    //Empty the array used for autocomplete
                    while(autocompletestreamlist.length > 0) {
                        autocompletestreamlist.pop();
                    }

                    $.ajax({
                        url: 'https://api.twitch.tv/kraken/search/channels?q={streamnames}'.format({ streamnames: streamnames}),

                        // the name of the callback parameter, as specified by the YQL service
                        jsonp: "callback",

                        // tell jQuery we're expecting JSONP
                        dataType: "jsonp",

                        // work with the response
                        success: function( response ) {

                            streams = response;
                            length = streams.channels.length;

                            for (i = 0; i < length; i++) {
                                console.log(streams.channels[i].display_name);
                                 autocompletestreamlist.push(streams.channels[i].display_name);
                            }

                            $('#streamnames').autocomplete({
                                source: autocompletestreamlist
                            });
                            console.log( response ); // server response
                            console.log( autocompletestreamlist);
                        }

                    });
                }
            </script>
