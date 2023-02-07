'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('editFunnelChart100DevCtrl', editFunnelChart100DevCtrl);

  editFunnelChart100DevCtrl.$inject = ['$scope', '$uibModalInstance', 'config', 'appModulesService', '_','CRUD_HUB'];

  function editFunnelChart100DevCtrl($scope, $uibModalInstance, config, appModulesService, _, CRUD_HUB) {
    $scope.cancel = cancel;
    $scope.save = save;
    $scope.config = config;
    $scope.setNull = setNull;
    // $scope.displayModule = displayModule;
    $scope.funnelLevel = {
      levels: [1, 2, 3, 4],
    };
    $scope.params = {
      dateTimeOptions: CRUD_HUB.DATETIME_PAST
    };

    function init() {
      appModulesService.load(true).then(function (modules) {
        $scope.modules = modules;
      })
    }
    init();

    // function displayModule() {
    //   var module = _.filter( $scope.modules, function(module){
    //     return module.type === $scope.config.module1;
    //   })
    //   console.log('module1 ', module);
    // }

    function setNull() {
      $scope.config.modules = [];
      $scope.config.module1 = null;
      $scope.config.module2 = null;
      $scope.config.module3 = null;
      $scope.config.module4 = null;
    }

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    function save() {
      $scope.config.moduleList = [];
      for(var i = 1; i<= $scope.config.funnelLevel; i++){
        var moduleVar = 'module'+i;
        var module = _.filter( $scope.modules, function(module){
          return module.type === $scope.config[moduleVar];
        })
        $scope.config.moduleList.push({'name': module[0].name, 'type':module[0].type});
      }
      // console.log("MOdule List", $scope.config.moduleList);

      $uibModalInstance.close($scope.config);
    }

  }
})();