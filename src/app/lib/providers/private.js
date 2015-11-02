(function (App) {
    'use strict';

    var Q = require('q');
    var request = require('request');
    var inherits = require('util').inherits;
    var querystring = require('querystring');

    function Private() {
        if (!(this instanceof Private)) {
            return new Private();
        }

        App.Providers.Generic.call(this);
    }
    inherits(Private, App.Providers.Generic);

    Private.prototype.extractIds = function (items) {
        return _.pluck(items.results, 'private_id');
    };

    Private.prototype.config = {
        uniqueId: 'imdb_id',
        tabName: 'Private',
        type: 'movie',
        /* should be removed */
        //subtitle: 'ysubs',
        //metadata: 'trakttv:movie-metadata'
    };

    function formatForButter(data) {
        var results = _.chain(data.movies)
            .filter(function (movie) {
                // Filter any 3D only movies
                return _.any(movie.torrents, function (torrent) {
                    return torrent.quality !== '3D';
                });
            }).map(function (movie) {
                return {
                    type: 'movie',
                    private_id: movie.id,
                    imdb_id: movie.id,
                    title: movie.title,
                    year: movie.year,
                    genre: movie.genres,
                    rating: movie.rating,
                    runtime: movie.runtime,
                    image: movie.images.poster,
                    cover: movie.images.posterBig,
                    backdrop: movie.images.backdrops[0],
                    subtitle: false,
                    bookmarked: false,
                    health: 'Health false',
                    watched: false,
                    provider: 'adult',
                    synopsis: movie.synopsis,
                    trailer: false,
                    certification: 'R',
                    torrents: _.reduce(movie.torrents, function (torrents, torrent) {
                        if (torrent.quality !== '3D') {
                            torrents[torrent.quality] = {
                                url: torrent.url,
                                magnet: torrent.magnet,
                                size: torrent.size,
                                filesize: torrent.size,
                                seed: torrent.seed,
                                peer: torrent.peer
                            };
                        }
                        return torrents;
                    }, {})
                };
            }).value();

        return {
            results: Common.sanitize(results),
            hasMore: data.movie_count > data.page_number * data.limit
        };
    }

    Private.prototype.fetch = function (filters) {
        // using wireshark with filter: http.host contains "privatetorrents"
        // default:
        // http://www.apiprivatetorrents.com/movies?sort=seeds&count=50&with_rt_ratings=true&page=1
        // genre=anal:
        // http://www.apiprivatetorrents.com/movies?sort=seeds&count=50&with_rt_ratings=true&page=1&genre=4
        // search="lesbian milf":
        // http://www.apiprivatetorrents.com/movies?sort=seeds&count=50&with_rt_ratings=true&page=1&keyworkds=lesbian%20milf
        // filter="Date Added"
        // http://www.apiprivatetorrents.com/movies?sort=dateadded&count=50&with_rt_ratings=true&page=1&keywords=lesbian%20milf

        var params = {
            count: 50
        };

        if (filters.sorter) {
            switch (filters.sorter) {
            case 'popularity':
                params.sort = 'seeds';
                break;
            case 'date added':
                params.sort = 'dateadded';
                break;
            default:
                params.sort = filters.sorter;
            }
        }

        if (filters.page) {
            params.page = filters.page;
        }

        if (filters.keywords) {
            params.keywords = filters.keywords;
        }

        if (filters.genre && (filters.genre !== 'All')) {
            switch (filters.genre) {
            case 'Anal':
                params.genre = 4;
                break;
            case 'European':
                params.genre = 16;
                break;
            case 'Mature':
                params.genre = 26;
                break;
            case 'Milf':
                params.genre = 30;
                break;
            default:
                win.info('unknown genre', filters.genre);
                break;
            }
        }

        //         if (filters.order === 1) {
        //             params.order_by = 'asc';
        //         }


        //         if (Settings.movies_quality !== 'all') {
        //             params.quality = Settings.movies_quality;
        //         }
        // 
        //         if (Settings.translateSynopsis) {
        //             params.lang = Settings.language;
        //         }


        var defer = Q.defer();
        var url = 'http://www.apiprivatetorrents.com/' + 'movies?' + querystring.stringify(params).replace(/%25%20/g, '%20');

        win.info('Request to Private API', url);
        request({
            url: url,
            json: true
        }, function (error, response, data) {
            if (error || response.statusCode >= 400) {
                defer.reject(error);
            } else if (!data || (data.error && data.error !== 'No movies found')) {
                var err = data ? data.error : 'No data returned';
                win.error('API error:', err);
                defer.reject(err);
            } else {
                defer.resolve(formatForButter(data.data));
            }
        });

        return defer.promise;
    };

    Private.prototype.detail = function (torrent_id, old_data) {
        return Q(old_data);
    };

    App.Providers.Private = Private;

})(window.App);
