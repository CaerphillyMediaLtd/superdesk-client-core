ConfigController.$inject = ['$scope'];

export function ConfigController($scope) {
    $scope.configuration = _.clone($scope.widget.configuration);

    $scope.saveConfig = function() {
        $scope.widget.configuration = $scope.configuration;
        $scope.save();
        $scope.$close();
    };
}
