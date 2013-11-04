
// - Refresh table when finishes
// - Refresh user model when finishes/error/cancel etc
// - Check put error when check old georeferencing
// - Pending tests


  /**
   *  Geocoder background process
   *
   *  - It needs several models, like geocoder, table, user,...
   *  
   *  new cdb.admin.BackgroundTab({
   *    model: geocoder_model,
   *    vis: vis_model,
   *    table: table_model,
   *    globalError: globalError,
   *    user: user_model
   *  })
   */

  cdb.admin.BackgroundTab = cdb.core.View.extend({

    initialize: function() {
      this.initBinds();
      this.initViews();
      this.getGeocodifications();
    }, 

    initBinds: function() {
      this.model.bind('change:formatter', this._onChangeFormatter, this);
    },

    initViews: function() {
      // Background geocoder
      this.bkg_geocoder = new cdb.admin.BackgroundGeocoder({
        template_base: 'table/views/geocoder_progress',
        model: this.model
      });
      this.bkg_geocoder.bindGeocoder();
      this.$el.append(this.bkg_geocoder.render().el);
      this.addView(this.bkg_geocoder);
    },

    setActiveLayer: function(layerView, layer) {
      this.model.resetGeocoding();
      this.table = layerView.table;
      // Check actual table if there is any pending geocodification.
      this.checkGeocodification();
    },

    _onChangeFormatter: function() {
      var self = this;

      this.model
        .save({
            table_name: this.table.get('id')
          },
          {
            wait: false,
            success: function(m) {
              m.pollCheck();
            }
          }
        );
    },

    getGeocodifications: function() {
      if (this.geocodings) {
        this.checkGeocodification();
      } else {
        var self = this;
        var geocodings = new cdb.admin.Geocodings();
        geocodings.fetch({
          success: function(r) {
            self.geocodings = new Backbone.Collection(r.get('geocodings'));
            self.checkGeocodification();
          },
          error: function(e) {
            self.geocodings = new Backbone.Collection();
            cdb.log.info('Geocoding API is not working! -> getGeocodifications')
          }
        })
      }
    },

    checkGeocodification: function() {
      if (this.geocodings && this.table && this.table.get('id')) {
        var self = this;
        var g = this.geocodings.filter(function(m) {
          return m.get('table_name') == self.table.get('id') && m.get('state') != "finished"
        });
        
        if (g.length > 0) {
          var obj = g[0];
          this.model.set('id', obj.get('id'));
          this.model.pollCheck();
        }
      }
    }

  });