(function (App) {
    'use strict';

    var AdultCollection = App.Model.Collection.extend({
        model: App.Model.Movie,
        popid: 'imdb_id',
        type: 'adult',
        getProviders: function () {
            return {
                torrents: App.Config.getProvider('adult')
            };
        },
    });

    App.Model.AdultCollection = AdultCollection;
})(window.App);
