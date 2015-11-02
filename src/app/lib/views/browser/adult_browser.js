(function (App) {
    'use strict';

    var AdultBrowser = App.View.PCTBrowser.extend({
        collectionModel: App.Model.AdultCollection,
        filters: {
            genres: App.Config.genres_adult,
            sorters: App.Config.sorters_adult
                //types: App.Config.types_adult
        }
    });

    App.View.AdultBrowser = AdultBrowser;
})(window.App);
