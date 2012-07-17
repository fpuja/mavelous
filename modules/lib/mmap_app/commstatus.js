
$(function(){
  window.CommStatusModel = Backbone.Model.extend({
    SERVER_TIMEOUT_INTERVAL:    3000,
    HEARTBEAT_TIMEOUT_INTERVAL: 2000,
    /* Constants: */
    UNINITIALIZED: 0,
    OK : 1,
    TIMED_OUT_ONCE: 2,
    TIMED_OUT_MANY: 3,
    ERROR : 4,

    defaults: function() {
      return {
        mav: this.UNINITIALIZED,
        server: this.UNINITIALIZED
      };
    },

    initialize: function() {
      /* Only initialize the server.
       * Mav is uninitialized until first heartbeat. */
      this.resetServerTimeout();
    },

    onHeartbeat: function () {
      this.set('mav', this.OK);
      this.resetHeartbeatTimeout();
    },

    resetHeartbeatTimeout: function () {
      var self = this;
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout =
              setTimeout(function(){ self.onHeartbeatTimeout(); },
                         this.HEARTBEAT_TIMEOUT_INTERVAL);
    },

    onHeartbeatTimeout: function () {
      var mavstat = this.get('mav');
      if (mavstat == this.OK) {
        this.set('mav', this.TIMED_OUT_ONCE);
      } else if ( mavstat == this.TIMED_OUT_ONCE) {
        this.set('mav', this.TIMED_OUT_MANY);
      }
      /* Do nothing if uninitialized. */
      this.resetHeartbeatTimeout();
    },

    onServerSuccess: function () {
      this.set('server', this.OK);
      this.resetServerTimeout();
    },

    onServerFail: function () {
      this.set('server', this.ERROR);
    },

    resetServerTimeout: function () {
      var self = this;
      clearTimeout(this.serverTimeout);
      this.serverTimeout =
            setTimeout(function(){ self.onServerTimeout(); },
                       this.SERVER_TIMEOUT_INTERVAL);
    },
          
    onServerTimeout: function () {
      var serverstat = this.get('server');
      if (serverstat == this.OK) {
        this.set('server', this.TIMED_OUT_ONCE);
      } else if ( serverstat == this.TIMED_OUT_ONCE) {
        this.set('server', this.TIMED_OUT_MANY);
      }
      /* Do nothing if there is an error or uninitialized. */
      this.resetServerTimeout();
    }
  });

  window.CommStatusView = Backbone.View.extend({
    template: _.template($('#commstatustexttemplate').html()),

    initialize: function () {
      $("#commstatustextview").replaceWith(this.render().el);
      this.model.bind('change', this.render, this);
    },

    render_status: function (stat) {
      if (stat == this.model.UNINITIALIZED) {
        return '<span class="slow">?</span>';
      } else if (stat == this.model.OK) {
        return '<span class="ok">OK</span>';
      } else if (stat == this.model.TIMED_OUT_ONCE) {
        return '<span class="slow">TIMED OUT</span>';
      } else if (stat == this.model.TIMED_OUT_MANY) {
        return '<span class="error">TIMED OUT</span>';
      } else {
        return '<span class="error">ERROR</span>';
      }
    },
    render: function () {
      var mdl = this.model.toJSON();
      mdl.server_html = this.render_status(mdl.server);
      mdl.mav_html = this.render_status(mdl.mav);
      this.$el.html(this.template(mdl));
      return this;
    }
  });


});