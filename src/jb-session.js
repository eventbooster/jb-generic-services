/**
* Simple session handling for angular 1.x (through localStorage). Used for user authentication and simple
* data storage for the back office.
*
* - Creates an two objects in localStorage (user/local) and appends all data to them
* - Enables you to remove all the user's data from localStorage when the user loggs out
* - Expiration dates can be set on all objects added.
*
* The following scopes are available when storing data:
* - «user»: All user based data. Will be removed on logout (see UserService); is the default scope.
* - «local»: All data that doesn't depend on the user. Will not be removed.
*/

( function() {

	'use strict';

	angular
	.module( 'jb.session', [] )
	.factory( 'SessionService', [ function() {


		/////////////////////////////////////
		//
		// Valid scope variables.
		//

		// Scope with higher priority must be first (it's value will be returned first if 
		// no scope was passed to get())
		var validScopes = [
			'user'
			, 'local'
		];

		function isScopeValid( scopeName ) {
			return validScopes.indexOf( scopeName ) > -1;
		}


		/////////////////////////////////////
		//
		// LocalStorage support
		//

		function supportsLocalStorage() {
			try {
				var itemIdentifier = 'testEntry-' + new Date().getTime();
				localStorage.setItem( itemIdentifier, itemIdentifier );
				localStorage.removeItem( itemIdentifier );
				return true;
			}
			catch( e ) {
				return false;
			}
		}

		/**
		* @param <Array> keyBeginnings			Start strings of the key names that should be removed,
		*										e.g. [ 'session-user-', 'session-', 'session-local-keyname' ]
		*/
		function removeFromLocalStorage( keyBeginnings ) {

			keyBeginnings.forEach( function( keyBeginning) {

				for( var i = 0; i < localStorage.length; i++ ) {

					var key = localStorage.key( i );
					if( key.indexOf( keyBeginning ) === 0 ) {
						localStorage.removeItem( key );
						console.log( 'Session: Removed key %s from localStorage', key );
					}

				}

			} );

		}


		/////////////////////////////////////
		//
		// Stuff
		//

		var keyPrefix = 'jb-session-';

		function createLocalStorageKey( scope, key ) {
			return keyPrefix + scope + '-' + key;
		}

		function createValidDate( date ) {

			if( Object.prototype.toString.call( date ) === '[object Date]' ) {
				return date;
			}

			if( !isNaN( new Date( date ).getTime() ) ) {
				return new Date( date );
			}

			return false;

		}



		/////////////////////////////////////
		//
		// Session 
		//

		var Session = function() {
			if( !supportsLocalStorage() ) {
				throw new Error( 'Session: Your browser does not support the HTML5 localStorage object. Please update your browser or enable localStorage support.' );
			}
		};



		/**
		* @param <String> key			Key to store data on
		* @param <Anything> data		Data; must be serializable through JSON.stringify()
		* @param <String> scope			'user' or 'local'; may be omitted ('user' is used)
		*/
		Session.prototype.set = function( key, data, scope, expirationDate ) {

			scope = scope || 'user';

			if( !key ) {
				throw new Error( 'Session: No key passed' );
			}

			if( !isScopeValid( scope ) ) {
				throw new Error( 'Session: The scope \'' + scope + '\' is not valid. Please use scopes ' + validScopes.map( function( item ) { return '\'' + item + '\''; } ).join( ' or ' ) + '.' );
			}

			if( expirationDate && !createValidDate( expirationDate ) ) {
				throw new Error( 'Session: Your expirationDate ' + expirationDate + ' is not a valid date.' );
			}

			var localStorageKey				= createLocalStorageKey( scope, key )
				, localStorageData			= {
					expirationDate			: createValidDate( expirationDate ) || null
					, data					: data
				};

			console.log( 'Session: Store %o in %o', localStorageData, localStorageKey );

			if( localStorage.getItem( localStorageKey ) ) {
				console.log( 'Session: Overwriting existing data for %s', localStorageKey );
			}

			var stringifiedData = JSON.stringify( localStorageData );

			localStorage.setItem( localStorageKey, stringifiedData );

		};


		/**
		* Returns data from localStorage. 
		* @param <String> key			Key used to store data
		* @param <String> scope			Scope used to store data; may be omitted
		*								(both scopes are searched for, user data
		*								is returned with higher priority)
		*/
		Session.prototype.get = function( key, scope ) {

			var result
				, scopes = scope ? [ scope ] : validScopes

				// Must be public in order to remove expired items.
				, localStorageKey;

			// Get item from localStorage; if no scope was provided, take user first. 
			scopes.some( function( scope ) {

				localStorageKey		= createLocalStorageKey( scope, key );

				var data			= localStorage.getItem( localStorageKey );

				if( data ) {
					result = data;
					return true;
				}

			} );

			if( !result ) {
				return undefined;
			}

			// JSON-parse data
			var parsedData;
			try {
				parsedData = JSON.parse( result );

				// null is default value if date is not set, see set method
				if( parsedData.expirationDate !== null ) {
					parsedData.expirationDate = new Date( parsedData.expirationDate );
				}
			}
			catch( e ) {
				throw new Error( 'Session: Data \'' + result + '\'could not be parsed from JSON.' );
			}

			// Check for expiration
			if( parsedData.expirationDate && parsedData.expirationDate.getTime() < new Date().getTime() ) {
				localStorage.removeItem( localStorageKey );
				return undefined;
			}

			return parsedData.data;

		};



		/**
		* Remove all user scoped data from the localStorage
		*/
		Session.prototype.logout = function() {
			removeFromLocalStorage( [ keyPrefix + 'user' ] );
		};

		/**
		* Remove everything from the localStorage.
		*/
		Session.prototype.destroy = function() {
			removeFromLocalStorage( [ keyPrefix + 'user', keyPrefix + 'local' ] );
		};

		/**
		* Removes single item. 
		* @scope <String> scope				Scope that the item should be removed from. If not passed,
		*									all scopes are cleared.
		*/
		Session.prototype.remove = function( key, scope ) {

			var keys = [];
			if( scope ) {
				keys.push( createLocalStorageKey( scope, key ) );
			}
			else {
				validScopes.forEach( function( scope ) {
					keys.push( createLocalStorageKey( scope, key ) );
				} );
			}

			removeFromLocalStorage( keys );

		};

		return new Session();

	} ] );

} )();

