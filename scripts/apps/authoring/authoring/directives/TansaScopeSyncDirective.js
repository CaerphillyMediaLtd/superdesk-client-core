/*
 * TansaScopeSync synchornises any changes caused by tansa to the DOM with the ng-model of the host
 */

TansaScopeSyncDirective.$inject = ['$rootScope'];
export function TansaScopeSyncDirective($rootScope) {
    return {
        require: ['ngModel'],
        link: function(scope, elem, attrs, controllers) {
            let ngModel = controllers[0];

            var deregisterTansa = $rootScope.$on('tansa:after', () => {
                var nodeValue = getValue(elem[0]);

                if (nodeValue !== ngModel.$viewValue) {
                    ngModel.$setViewValue(nodeValue);
                }
            });

            function getValue(node) {
                if ($(node).is('input') || $(node).is('textarea')) {
                    return node.value;
                }

                var txt = $(node).find('.text-editor');

                return _.find(txt, (elem) => $(elem).is(':visible')).innerHTML;
            }

            scope.$on('$destroy', deregisterTansa);
        }
    };
}
