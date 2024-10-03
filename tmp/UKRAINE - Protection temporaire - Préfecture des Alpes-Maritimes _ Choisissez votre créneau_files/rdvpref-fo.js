VUiExtensions = {
	methods : {
        //fin de la surcharge on AjaxError
		hasErreurFormulaire : function(uiMessageStack, champ) {
			return (uiMessageStack.objectFieldErrors.reservation != null && uiMessageStack.objectFieldErrors.reservation['formulaire_'+ champ] != null)
		},
		getErreurFormulaire : function(uiMessageStack, champ) {
			return uiMessageStack.objectFieldErrors.reservation['formulaire_'+ champ].join(', ');
		},
		formatMinutes: function(minutes) {
            let min;
            let heure;
            if(minutes && isNaN(minutes)) {
                 splitMin = minutes.split(':');
                 heure = splitMin[0];
                 min = splitMin[1];
            } else {
			     min = '' + minutes % 60;
			     heure = '' + (minutes - min) / 60
			}
			return heure.padStart(2, '0') + 'h' + min.padStart(2, '0')
		},
		formatDateLocale: function(dateLocale, format, offsetJour) {
			let offset = offsetJour? offsetJour : 0; 
			return Quasar.date.formatDate(Quasar.date.addToDate(Quasar.date.extractDate(dateLocale, 'DD/MM/YYYY'), { days: offset }) , format)        
		},
		formatDateLocaleToMonday: function(dateLocale, format, offsetJour) {
            var orignalDate = Quasar.date.extractDate(dateLocale, 'DD/MM/YYYY')
            var modifiedDate = Quasar.date.extractDate(dateLocale, 'DD/MM/YYYY')
            var day = orignalDate.getDay()
              diff = orignalDate.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
              modifiedDate.setDate(diff)
            
            var diffInDate = orignalDate.getDate() - modifiedDate.getDate()
            if(diffInDate == 7) {
              diff = diff + 7
              modifiedDate.setDate(diff)
            }
            let offset = offsetJour? offsetJour : 0; 
            return Quasar.date.formatDate(Quasar.date.addToDate(modifiedDate ,{ days: offset }) , format)
        },
		formatInstant: function(dateLocale, format = 'DD/MM/YYYY à HH:mm') {
			return Quasar.date.formatDate(Quasar.date.extractDate(dateLocale, 'DD/MM/YYYY HH:mm') , format)
		},
        getWeekRange: function ({dateMin, dateMax}, format = 'DD/MM/YYYY') {
			function setDay(date, day) {
				const _day = date.getDay();
				const diff = date.getDate() + day - (_day === 0 ? 7 : _day);
				date.setDate(diff);
				return date
			}

			function setMonday(date) {
				return setDay(date, 1);
			}

			function setFriday(date) {
				return setDay(date, 5);
			}

			const monday = setMonday(Quasar.date.extractDate(dateMin, format));
			const friday = setFriday(Quasar.date.extractDate(dateMax, format));
			return [Quasar.date.formatDate(monday, format), Quasar.date.formatDate(friday, format)];
		},
	},
	rootOptions: {
		onUnauthorized: function(response) {
			if(response.data.message) window.location = response.data.message
		}
	}
}


window.addEventListener('vui-before-plugins', function(event) {
	let vuiApp = event.detail.vuiAppInstance;
	vuiApp.component('rdv-formulaire',Vue.defineComponent({
		props: {
			modelValue: { type: Object, required: true },
		},
		data: function() {
			return {
				formulaire :  {}
			}
		},
		template: `
			<div>
				<slot v-bind:formulaire="formulaire" >
				</slot>
			</div>
		`
		,
		emits: ["update:modelValue"],
		created: function() {
			if(this.$props.modelValue) {
				this.$data.formulaire = this.$props.modelValue
			} else {
				this.$data.formulaire = {}
			}
		},
		watch: {
			modelValue: function(newVal) {
				this.$data.formulaire = newVal;
			},
			formulaire: {
				handler: function(newVal) {
					this.$emit('update:modelValue', this.$data.formulaire);
				},
				deep: true
			},
		}
	})
	);

	vuiApp.component('rdv-choix-tranche', Vue.defineComponent({
		props: {
			modelValue: { type: String},
			isDisplayCalendar: { type: Boolean},
			isCurrentMinWeek: { type: Boolean},
			isCurrentMaxWeek: { type: Boolean},
			premierJour: { type: String, required: true },
			premiereDispo: { type: String },
			tranches: { type: Array, required: true },
			nombreDeJour: { type: Number, required: true },
			nombreDeLigne: { type: Number, required: true },
			precedentePub: { type: String },
			prochainePub: { type: String },
	
		},
		emits: ["update:modelValue"],
		data: function() {
			return {
				jours: [],
				tranchesParJour: {},
				toutVoir: false,
				blocSelectionne: null
			}
		},
		template: `
			<div>
				<template v-if="!$q.screen.lt.sm">
					<div class="row q-gutter-xs" v-if="this.isDisplayCalendar">
						<template v-for="entry in Object.entries(tranchesParJour)" :key="entry[0]" >
							<div class="column col items-center blocCreneauSelection">
								<h3 class="celulleHeader text-bold text-center">
									{{ VUiExtensions.methods.formatDateLocale(entry[0], 'dddd') }}<br/>
									{{ VUiExtensions.methods.formatDateLocale(entry[0], 'DD/MM') }}
								</h3>
								<ul>
								<template v-for="index in getNombreDeLigneAffichees()" >
									<template v-if="index-1 < entry[1].length"  >
										<li :key="entry[1][index-1].trhId" class="row cellule justify-center radio-card" :class="{ even: index%2 === 0 }"  >
											<input type="radio" v-bind:value="blocSelectionne" @change="updateValue" name="trhId" :id="'trhId_' + entry[1][index-1].trhId" :data-value="entry[1][index-1].trhId" v-bind="{ checked: entry[1][index-1].trhId === blocSelectionne }" />
											<label class="fr-label" :for="'trhId_' + entry[1][index-1].trhId" >{{ VUiExtensions.methods.formatMinutes( entry[1][index-1].minutesDebut)}}</label>
										</li>
									</template>
								</template>
								</ul>
							</div>
						</template>
					</div>
				</template>
				
				<template v-if="this.isDisplayCalendar">
					<div class="row col-12 justify-center" v-if="isCurrentMaxWeek">
						<div class="text-center q-pa-md">Aucun créneau disponible à partir de cette date.<br/>Veuillez réessayer ultérieurement.</div>
					</div>
					<div class="column col-12 justify-center" v-if="!isCurrentMaxWeek && this.tranches.length === 0">
						<div class="text-center q-pa-md">Aucun créneau disponible sur cette semaine</div>
	                    <div class="text-center q-pa-md" v-if="this.$props.premiereDispo !== ''">
	                    	<q-btn color="primary" @click="voirProchaineDispo" >Prochaine disponibilité le {{this.$props.premiereDispo}}</q-btn>
	                    </div>
					</div>
				</template>
				<template v-else>
					<div class="row col-12 justify-center">
						<div class="text-center q-pa-md">Veuillez réessayer ultérieurement.</div>
					</div>
				</template>
				
				<template v-if="!this.isDisplayCalendar || isCurrentMaxWeek">
					<div class="row col-12 justify-center">
						<div class="text-center q-pa-md" v-if="this.$props.prochainePub">
							<span class="fr-text--italic fr-text--bold">Prochaine mise en ligne de nouveaux rendez-vous : le {{ VUiExtensions.methods.formatInstant(this.$props.prochainePub.instantPublication) }}</span><br>
							<span class="fr-text--italic">pour des créneaux de la semaine du {{ VUiExtensions.methods.getWeekRange(this.$props.prochainePub)[0] }}</span>
						</div>
						<div class="text-center q-pa-md" v-if="this.$props.precedentePub">
							<span class="fr-text--italic fr-text--bold">Dernière mise en ligne de rendez-vous : le {{ VUiExtensions.methods.formatInstant(this.$props.precedentePub.instantPublication) }}</span><br>
							<span class="fr-text--italic">pour des créneaux de la semaine du {{ VUiExtensions.methods.getWeekRange(this.$props.precedentePub)[0] }}</span>
						</div>
					</div>
				</template>
				
				<template v-if="!$q.screen.lt.sm">
					<div class="row items-center q-mt-md" v-if="canShowMore()" >
						<div class="full-width text-center">
							<button @click.prevent="$data.toutVoir=true;" class="fr-btn fr-btn--tertiary-no-outline" >Voir plus de créneaux</button>
						</div>
					</div>
				</template>
				<template v-else>
					<q-list v-if="this.tranches.length > 0" class="col-12" >
					<template v-for="(entry, idxJour) in Object.entries(tranchesParJour)" :key="'mob'+ entry[0]">
						<q-expansion-item group="jour" @before-hide="$data.toutVoir=false" :default-opened="idxJour==premierJourAvecDispo()" :label="VUiExtensions.methods.formatDateLocale(entry[0], 'dddd') +' '+ VUiExtensions.methods.formatDateLocale(entry[0], 'DD/MM')" >
							<div class="row q-gutter-x-md">
								<ul class="row q-gutter-x-md">
								<template v-for="index in nombreDeLigneMobile(entry[1].length)" :key="'mob'+ entry[1][index-1].trhId"  >
									<li class="radio-card" >
										<input type="radio" v-bind:value="blocSelectionne" @change="updateValue" name="trhId" :id="'trhId_' + entry[1][index-1].trhId" :data-value="entry[1][index-1].trhId" v-bind="{ checked: entry[1][index-1].trhId === blocSelectionne }" />
										<label class="fr-label" :for="'trhId_' + entry[1][index-1].trhId" >{{ VUiExtensions.methods.formatMinutes( entry[1][index-1].minutesDebut)}}</label>
									</li>
								</template>
								</ul>
								<div class="full-width text-center q-my-md" v-if="!$data.toutVoir && entry[1].length > 0 ">
									<button @click.prevent="$data.toutVoir=true;" class="fr-btn fr-btn--tertiary-no-outline" >Voir plus de créneaux</button>
								</div>
								<div class="full-width text-center q-mt-md" v-if="entry[1].length == 0 ">
									<div>Aucun créneau disponible</div>
								</div>
							</div>
						</q-expansion-item>
					</template>
					</q-list>
				</template>
			</div>
		`
		,
		created: function() {
			this.repartirBlocsParJours()
		},
		watch: {
			tranches: function(newVal) {
				this.repartirBlocsParJours();
				this.$data.toutVoir = false;
			},
			premierJour: function(newVal) {
				this.repartirBlocsParJours();
				this.$data.toutVoir = false;
			},
			modelValue: function(newVal) {
				this.$data.blocSelectionne = newVal;
			}
		},
		methods: {
			repartirBlocsParJours: function() {
				// calculer les jours à afficher 
				let dateLundi = Quasar.date.extractDate(this.$props.premierJour, 'DD/MM/YYYY')
				let jours = []
				for (let i = 0; i < this.$props.nombreDeJour; i++) {
					jours.push(Quasar.date.formatDate(new Date(dateLundi.getTime() + 1000 * 60 * 60 * 24 * i), 'DD/MM/YYYY'))
				}
				this.$data.jours = jours;
	
				let tranchesParJour = {};
				for (jour of jours) {
					tranchesParJour[jour] = this.$props.tranches.filter(bloc => bloc.dateLocale === jour)
				}
				this.$data.tranchesParJour = tranchesParJour;
			},
			getNombreDeLigneAffichees: function() {
				if (this.$data.toutVoir) {
					let max = 0
					for (jour of this.$data.jours) {
						let nbBloc = this.$data.tranchesParJour[jour].length;
						if (max < nbBloc) {
							max = nbBloc
						}
					}
					return max
				}
				return this.$props.nombreDeLigne;
			},
			nombreDeLigneMobile: function (nbBlocLigne) {
				return  this.$data.toutVoir ? nbBlocLigne : Math.min(nbBlocLigne, this.$props.nombreDeLigne) 
			},
			updateValue: function(event) {
				this.$data.blocSelectionne = event.target.dataset.value;
				this.$emit('update:modelValue', this.$data.blocSelectionne);
			},
			canShowMore: function() {
				let max = 0
				for (jour of this.$data.jours) {
					let nbBloc = this.$data.tranchesParJour[jour].length;
					if (max < nbBloc) {
						max = nbBloc
					}
				}
				return !this.$data.toutVoir && (max > this.$props.nombreDeLigne)
			},
			voirProchaineDispo: function() {
				this.$emit('voir-prochaine-dispo');
			},
			premierJourAvecDispo: function() {
				for (let i = 0; i < this.$data.jours.length; i++) {
					if(this.$data.tranchesParJour[this.$data.jours[i]].length > 0) {
						return i;
					}
				}
			}
	
		}
	})
	);
	
	vuiApp.component('rdv-captchetat', Vue.defineComponent({
		props: {
			endpointUrl: { type: String, required: true },
			captchaStyleName: { type: String, required: true },
			token: { type: String, required: false }
		},
		data: function() {
			return {
				captchaHtml: "",
				captchaId:""
			}
		},
		template: `
			<div>
				<div id='BDC_CaptchaComponent' v-html="captchaHtml"></div>
				<input type="hidden" name="captchaId" :value="captchaId" />
			</div>
		`
		,
		created: function() {
			this.getCaptchaHtml(this.$props.captchaStyleName)
		},
		mounted: function() {
			//getCaptchaHtml(this.$props.captchaStyleName)
		},
		methods: {
			getInstance: function() {
				let instance = null;
				if (typeof window.botdetect !== 'undefined') {
					instance = window.botdetect.getInstanceByStyleName(this.$props.captchaStyleName);
				}
				return instance;
			},
	
			// the current captcha id, which will be used for server-side validation purpose.
			getCaptchaId: function() {
				return this.getInstance().captchaId;
			},
	
			getUserEnteredCaptchaCode: function() {
				return this.getInstance().userInput.value;
			},
	
			getCaptchaHtml: function(captchaStyleName) {
				var url = this.$props.endpointUrl + '?get=html&c=' + captchaStyleName;
				if(this.$props.token) {
					this.$http.get(url, this.getAxiosConfig())
						.then(function(response) {
							let captchaHtml = this.changeRelativeToAbsoluteUrls(response.data, this.$props.endpointUrl);
							let imgUrl = captchaHtml.match(/id="captchaFR_CaptchaImage" src="([^"]+)"/)[1].replaceAll("&amp;", "&");
							let axiosConfig = Object.assign({}, this.getAxiosConfig());
										axiosConfig.headers.Accept = 'image/png';
										axiosConfig.responseType = 'arraybuffer';
										this.$http.get(imgUrl, axiosConfig).then(function(response) {
											let newUrl = window.URL.createObjectURL(new Blob([response.data], {type: "image/png"}));
											this.$data.captchaHtml = captchaHtml.replace(/id="captchaFR_CaptchaImage" src="([^"]+)"/, 'id="captchaFR_CaptchaImage" src="' + newUrl + '"')
											this.$nextTick(function() {
												this.loadScriptIncludes(captchaStyleName)
											}.bind(this))
										}.bind(this));
						}.bind(this))
	
				} else  {
					this.$http.get(url, this.getAxiosConfig())
					.then(function(response) {
						this.$data.captchaHtml = this.changeRelativeToAbsoluteUrls(response.data, this.$props.endpointUrl);
						this.$nextTick(function() {
							this.loadScriptIncludes(captchaStyleName)
						}.bind(this))
					}.bind(this))
				}
			},
	
			getAxiosConfig: function() {
				return {
					headers: { Authorization: 'Bearer ' + this.$props.token }
				}
			},
	
			loadScriptIncludes: function(captchaStyleName) {
				let captchaIdElement = window.document.getElementById('BDC_VCID_' + captchaStyleName);
				if (captchaIdElement) {
					let captchaId = captchaIdElement.value;
					let scriptIncludeUrl = this.$props.endpointUrl + '?get=script-include&c=' + captchaStyleName + '&t=' + captchaId + '&cs=203';
					
					this.$http.get(scriptIncludeUrl, this.getAxiosConfig())
						.then(function(response) {
							let loadedScript = response.data;
							let overrideScript = loadedScript.replace('get:function(a,b){var c=this.xhr();c&&0===c.readyState&&(c.onreadystatechange=function(){4===c.readyState&&b(c)},c.open("GET",a,!0),c.send())}',
							 'get:function(a,b){var c=this.xhr();c&&0===c.readyState&&(c.onreadystatechange=function(){4===c.readyState&&b(c)},c.open("GET",a,!0),c.setRequestHeader("Authorization", "Bearer '+this.$props.token+'"),c.send())}')
							
							f = new Function(overrideScript);
							f();
							
							let instance = this.getInstance();
							// register user input blur validation
							if (instance) {
								this.$data.captchaId = this.getCaptchaId()
								if (this.$props.token) {
								
									// gestion des images
									// premiere image
									instance.imageSrcUrl = this.$props.endpointUrl + '?get=image&c=' + this.$props.captchaStyleName+ '&t=' + instance.captchaId;
									instance.validationUrl = instance.imageSrcUrl.replace("get=image", "get=validation-result");
									instance.pUrl = instance.imageSrcUrl.replace("get=image", "get=p");
									instance.soundUrl = instance.imageSrcUrl.replace("get=image", "get=sound");
									
									// refresh des images
									instance.initNewImage = function(a) {
										instance.newImage = window.document.createElement("img");
										var b = instance,
											e = !1;
										let axiosConfig = Object.assign({}, this.getAxiosConfig());
										axiosConfig.headers.Accept = 'image/png';
										axiosConfig.responseType = 'arraybuffer';
										this.$http.get(a, axiosConfig).then(function(response) {
											let newUrl = window.URL.createObjectURL(new Blob([response.data], {type: "image/png"}));
											instance.newImage.src = newUrl;
											!e && b.newImage && b.imagePlaceholder && b.progressIndicator && (b.imagePlaceholder.innerHTML = "", b.imagePlaceholder.appendChild(b.newImage),
												b.image = b.newImage, b.progressIndicator = null, b.initImageColorModeHandler(), b.postReloadImage(), b = null, e = !0)
										}.bind(this));
										instance.newImage.id = instance.image.id;
										instance.newImage.alt = instance.image.alt;
										instance.imageSrcUrl = a;
										instance.soundUrl = instance.imageSrcUrl.replace("get=image", "get=sound");
										"none" !== instance.options.imageColorMode && instance.newImage.setAttribute("style", "visibility: hidden !important")
										
										// fix bug in lib soundPlaceholder should be cleared based on soundIcon and not soundIconSrc
										instance.playNewAudio = true
									}.bind(this);
									
									// gestion des sons
									let originalPlaySound = instance.playSound;
									instance.playSound = function() {
										if (!instance.soundPlayed || instance.playNewAudio ) {
											let axiosConfig = Object.assign({}, this.getAxiosConfig());
											axiosConfig.headers.Accept = 'audio/wav';
											axiosConfig.responseType = 'arraybuffer';
											this.$http.get(instance.soundUrl, axiosConfig).then(function(response) {
												let newUrl = window.URL.createObjectURL(new Blob([response.data], {type: "audio/wav"}));
												instance.soundUrl = newUrl;
												originalPlaySound.bind(instance)();
												let audio = window.document.getElementById("BDC_CaptchaSoundAudio_" + this.$props.captchaStyleName)
												audio.src = newUrl;
											}.bind(this));
										} else {
											originalPlaySound.bind(instance)();
										}
									}.bind(this);
								}
									
								window.document.getElementById(this.$props.captchaStyleName + '_SoundLink').href = "#";
								
								var userInput = instance.userInput;
								if (userInput && this.useUserInputBlurValidation(userInput)) {
									userInput.onblur = function() {
										var captchaCode = userInput.value;
										if (captchaCode.length !== 0) {
											this.validateUnsafe(instance, function(isHuman) {
												var event = new CustomEvent('validatecaptcha', { detail: isHuman });
												userInput.dispatchEvent(event);
												if (!isHuman) {
													this.reloadImage();
												}
											});
										}
									}.bind(this);
								}
	
							} else {
								console.error('window.botdetect undefined.');
							}
						}.bind(this));
				}
			},
	
			// reload a new captcha image.
			reloadImage: function() {
				this.getInstance().reloadImage();
			},
	
			validateUnsafe: function(captchaInstance, callback) {
				var captchaCode = captchaInstance.userInput.value;
				this.$http.get(captchaInstance.validationUrl + '&i=' + captchaCode, this.getAxiosConfig())
					.then(function(response) {
						let isHuman = response.data;
						isHuman = (isHuman == 'true');
						callback(isHuman);
					});
			},
	
			validate: function(callback) {
				let instance = this.getInstance();
				this.validateUnsafe(instance, function(isHuman) {
					callback(isHuman);
					if (!this.useUserInputBlurValidation(instance.userInput) && !isHuman) {
						instance.reloadImage();
					}
				}.bind(this));
			},
	
			useUserInputBlurValidation: function(userInput) {
				return (userInput.getAttribute('data-correct-captcha') !== null);
			},
	
			changeRelativeToAbsoluteUrls: function(originCaptchaHtml, captchaEndpoint) {
				var captchaEndpointHandler = this.getCaptchaEndpointHandler(captchaEndpoint);
				var backendUrl = this.getBackendBaseUrl(captchaEndpoint, captchaEndpointHandler);
	
				originCaptchaHtml = originCaptchaHtml.replace(/<script.*<\/script>/g, '');
				var relativeUrls = originCaptchaHtml.match(/(src|href)=\"([^"]+)\"/g);
	
				var relativeUrl, relativeUrlPrefixPattern, absoluteUrl,
					changedCaptchaHtml = originCaptchaHtml;
	
				for (var i = 0; i < relativeUrls.length; i++) {
					relativeUrl = relativeUrls[i].slice(0, -1).replace(/src=\"|href=\"/, '');
					relativeUrlPrefixPattern = new RegExp(".*" + captchaEndpointHandler);
					absoluteUrl = relativeUrl.replace(relativeUrlPrefixPattern, backendUrl + captchaEndpointHandler);
					changedCaptchaHtml = changedCaptchaHtml.replace(relativeUrl, absoluteUrl);
				}
	
				return changedCaptchaHtml;
			},
			getCaptchaEndpointHandler: function(captchaEndpoint) {
				var splited = captchaEndpoint.split('/');
				return splited[splited.length - 1];
			},
	
			// get backend base url from configued captchaEndpoint value
			getBackendBaseUrl: function(captchaEndpoint, captchaEndpointHandler) {
				var lastIndex = captchaEndpoint.lastIndexOf(captchaEndpointHandler);
				return captchaEndpoint.substring(0, lastIndex);
			},
		}
	})
	);
	
	vuiApp.directive('mask-url-params', {
	    bind: function(el, binding, vnode) {
	       //get param to delete
	       let paramToDelete = binding.value;
	       var currURL= window.location.search; //get current address
	       if(paramToDelete && currURL && currURL !== '') {
	         let params = new URLSearchParams(currURL);
	         params.delete(paramToDelete);
	         var keepParams = params.toString();
	         if(keepParams || keepParams == '') {
	             if(keepParams !== '' ) {
	                keepParams = '?'+keepParams;
	             }
	             window.history.pushState({}, "unused", window.location.pathname+keepParams );
	         }
	       }
	    },
	});
});

