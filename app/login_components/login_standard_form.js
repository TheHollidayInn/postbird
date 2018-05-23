class LoginStandardForm {
  /*::
    loginForm: LoginScreen
    form: JQuery<HTMLElement>
  */
  constructor(loginForm, content) {
    this.loginForm = loginForm;
    this.form = content.find('form.standard');

    this.initEvents();
  }

  initEvents () {
    this.form.bind('submit', this.onFormSubmit.bind(this));

    var allInputs = this.form.find('input[type=text], input[type=password]');

    allInputs.bind('keypress', (event) => {
      if (event.keyCode == 13) { // enter key
        $u.stopEvent(event);
        this.onFormSubmit(event);
      }
    });

    allInputs.bind('focus', this.formChanged.bind(this));
    allInputs.bind('keyup', this.formChanged.bind(this));

    this.form.find('input[type=checkbox]').bind('change', this.formChanged.bind(this));
  }

  getFormData ()/*: ConnectionOptions */ {
    return {
      type: 'hash',
      host: this.form.find('[name=host]').val().toString(),
      port: this.form.find('[name=port]').val().toString(),
      user: this.form.find('[name=user]').val().toString(),
      query: this.form.find('[name=query]').val().toString(),
      password: this.form.find('[name=password]').val().toString(),
      database: this.form.find('[name=database]').val().toString(),
      auto_connect: this.form.find('[name=auto_connect]').prop('checked')
    };
  }

  formChanged (event) {
    //console.log('formChanged', event.target);
    if (this.loginForm.isNewConnection()) return;

    var formData = this.getFormData();
    var isChanged = !this.loginForm.sameAsCurrent(formData);

    if (isChanged) {
      this.setButtonShown(true);
    } else {
      this.setButtonShown(false);
    }
  }

  setButtonShown (isShown) {
    this.form.find("button")[isShown ? 'show' : 'hide']();
  }

  onFormSubmit (e /*:: ?: any */, callback /*:: ?: Function */) {
    $u.stopEvent(e);
    var button = this.form.find('input[type=submit]');
    var buttonText = button.val();
    button.prop('disabled', true).val("Connecting...");

    var options = this.getFormData();

    this.loginForm.makeConnection(options, {}, (tab) => {
      console.log('makeConnection', tab);
      button.removeAttr('disabled').val(buttonText);
      if (callback && tab) callback(tab);
    });
  }

  fillForm (params) {
    params = Object.assign({}, {host: "localhost", user: "", password: "", database: "", query: ""}, params);

    ObjectKit.forEach(params, (k, v) => {
      var field = this.form.find('input[name=' + k + ']');
      if (field.attr("type") == "checkbox") {
        field.prop('checked', v);
      } else {
        field.val(v);
      }
    });
    this.setButtonShown(false);
  }

  testConnection () {
    App.startLoading("Connecting...");

    var options = this.getFormData();
    var conn = new Connection();
    conn.connectToServer(options, (status, message) => {
      App.stopLoading();
      if (status) {
        window.alertify.alert("Successfully connected!");
        conn.close();
      } else {
        window.alertify.alert(App.humanErrorMessage(message));
      }
    });
  }

  saveAndConnect (e /*:: ?: any */) {
    var name;

    if (!this.loginForm.connectionName) {
      var data = Model.SavedConn.savedConnections();
      var host = this.form.find('[name=host]').val();
      name = host;
      var i = 1;
      while (data[name]) {
        i += 1;
        name = host + ' #' + i;
      }
      this.loginForm.connectionName = name;
    }

    this.onFormSubmit(null, () => {
      Model.SavedConn.saveConnection(this.loginForm.connectionName, this.getFormData());
      this.loginForm.fillSavedConnections();
      this.setButtonShown(false);
    });
  }
}

global.LoginStandardForm = LoginStandardForm;
