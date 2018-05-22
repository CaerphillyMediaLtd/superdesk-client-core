export default angular.module('superdesk.core.upload.imagemodify', [
    'superdesk.core.translate',
])

    .directive('sdImageModify', () => ({
        scope: {
            src: '=',
            original: '=',
            brightness: '=',
            contrast: '=',
            saturate: '=',
            rotate: '=',
            fliph: '=',
            flipv: '=',
        },
        template: '<canvas id="image"></canvas>',
        link: function(scope) {
            let canvas = document.getElementById('image'),
                context = canvas.getContext('2d'),
                baseImage = new Image(),
                filter = {
                    brightness: scope.brightness ? 'brightness(' + scope.brightness + ') ' : '',
                    contrast: scope.contrast ? 'contrast(' + scope.contrast + ') ' : '',
                    saturate: scope.saturate ? 'saturate(' + scope.saturate + ') ' : '',
                };

            baseImage.onload = function() {
                canvas.width = baseImage.width;
                canvas.height = baseImage.height;

                context.filter = filter.brightness + filter.contrast + filter.saturate;
                context.drawImage(baseImage, 0, 0);
            };

            scope.$watch('brightness', (value, old) => {
                if (value !== old) {
                    filter.brightness = 'brightness(' + value + ') ';
                    context.filter = filter.brightness + filter.contrast + filter.saturate;
                    context.drawImage(baseImage, 0, 0);
                }
            });

            scope.$watch('contrast', (value, old) => {
                if (value !== old) {
                    filter.contrast = 'contrast(' + value + ') ';
                    context.filter = filter.brightness + filter.contrast + filter.saturate;
                    context.drawImage(baseImage, 0, 0);
                }
            });

            scope.$watch('saturate', (value, old) => {
                if (value !== old) {
                    filter.saturate = 'saturate(' + value + ') ';
                    context.filter = filter.brightness + filter.contrast + filter.saturate;
                    context.drawImage(baseImage, 0, 0);
                }
            });

            scope.$watch('rotate', (value, old) => {
                canvas.setAttribute('style',
                    'transform:rotate(' + value + 'deg);' +
                    '-webkit-transform:rotate(' + value + 'deg);' +
                    '-moz-transform:rotate(' + value + 'deg)');
            });

            scope.$watch('fliph', (value, old) => {
                canvas.setAttribute('style',
                    'transform:scaleX(' + value + ');' +
                    '-webkit-transform:scaleX(' + value + ');' +
                    '-moz-transform:scaleX(' + value + ')');
            });

            scope.$watch('flipv', (value, old) => {
                canvas.setAttribute('style',
                    'transform:scale(' + value + ', ' + value + ');' +
                    '-webkit-transform:scale(' + value + ', ' + value + ');' +
                    '-moz-transform:scale(' + value + ', ' + value + ')');
            });

            baseImage.src = scope.src;
        },
    }));