let $injector = null;

/**
 * @class
 * @name ProviderService
 * @description Returns a singleton that is used to access the Angular
 * application's injector. In order for this service to work, the application
 * must register the $injector (ideally via a .run clause) after loading.
 */
export default new class ProviderService {
    /**
     * @name ProviderService#register
     * @param {Object} injector The Angular $injector
     * @description Register an injector
     */
    register(injector) {
        $injector = injector;
    }

    /**
     * @name ProviderService#get
     * @param {string} name The name of the service to retrieve from the $injector.
     * @description Gets the given service from the injector. If a mock has been set
     * up for it, it returns that instead.
     */
    get(name) {
        if ($injector === null) {
            throw 'ng: $injector not registered for core/services/ng';
        }

        return $injector.get(name);
    }

    waitForServicesToBeAvailable() {
        return new Promise((resolve, reject) => {
            function checkNow() {
                if ($injector != null) {
                    window.clearInterval(interval);
                    resolve();
                    return true;
                }
            }

            let interval;

            if (checkNow() === true) {
                // make sure it doesn't register an interval if it resolves on the first go
                return;
            }

            interval = setInterval(checkNow, 100);
            setTimeout(() => {
                clearInterval(interval);
                reject('timed out while trying to resolve a service');
            }, 1000 * 60);
        });
    }

    getService(name) {
        return new Promise((resolve, reject) => {
            this.waitForServicesToBeAvailable()
                .then(() => {
                    resolve($injector.get(name));
                });
        });
    }
}();
