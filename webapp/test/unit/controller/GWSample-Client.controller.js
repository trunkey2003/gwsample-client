/*global QUnit*/

sap.ui.define([
	"ns/gwsampleclient/controller/GWSample-Client.controller"
], function (Controller) {
	"use strict";

	QUnit.module("GWSample-Client Controller");

	QUnit.test("I should test the GWSample-Client controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
