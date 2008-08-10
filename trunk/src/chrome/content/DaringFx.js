/*
 * © Romi Hardiyanto, 2008
 * 2008-05-10
 * Licence: MPL/GPL/LGPL
 * Although I haven't any permission from the site owner
 * hopefully this extension doesn't harm them
 */
    
DaringFx = {
	//init
	init: function() {
		this.initialized 	= true;
		this.strings 		= document.getElementById('strings')
		this.httpRequest 	= new XMLHttpRequest();
		this.domParser 		= new DOMParser();
		this.searchBox 		= document.getElementById("search-box");
		this.moreWords		= DaringFx.ARG_MORE;
		this.prevCount		= DaringFx.ARG_HEAD;
		this.pageNext		= false;
		this.pagePrev		= false;
		this.requestTimer = false;

		document.getElementById('search-box').focus();
  		this.selectedType = document.getElementById("option-button")
			.getAttribute("selectedtype");
		if (this.selectedType == DaringFx.ARG_OPKODE_START) {
    		document.getElementById("startwith")
				.setAttribute("checked", "true");
		} else if (this.selectedType == DaringFx.ARG_OPKODE_CONTAIN)  {
    		document.getElementById("contain")
				.setAttribute("checked", "true");
		} else {
    		document.getElementById("equal")
				.setAttribute("checked", "true");
		}
	},
	
	//debug
	dump: function(str) {
		window.prompt('', str);
	},

	//search from textbox	
	search: function(text, type, link, fullword, head, more, nextCommand) {
		if (text != '') {
			if (text.length == DaringFx.MIN_CHAR 
						&& type != DaringFx.ARG_OPKODE_EQ) {
				this.createActivityLabel(
					this.strings.getString('ACharacter_'));
			} else {
				this.createActivityLabel(
					this.strings.getString('Searching_'));
				var postMessage = 'DFTKATA=' + fullword + '&HEAD=' + head 
					+ '&KATA=&MORE=' + more + '&OPKODE=' + type 
					+ '&PARAM=' + text;
				if (nextCommand == '') {
					postMessage += '&PERINTAH=Cari';
				} else {
					postMessage += '&PERINTAH2=' + nextCommand;
				}
				this.httpRequest.open(
						DaringFx.FORM_METHOD, this.BASE_URL, true);
				//set timeout to handle 
				this.requestTimer = setTimeout(function() {
            DaringFx.httpRequest.abort();
            DaringFx.createActivityLabel(this.strings.getString('ServerTimeOut'));
        }, DaringFx.TIMEOUT);
				this.httpRequest.setRequestHeader("Pragma", "no-cache");
				this.httpRequest.setRequestHeader("Content-type", 
					"application/x-www-form-urlencoded");
				this.httpRequest.onreadystatechange = function() {
					DaringFx.searchReady(text, type);
				};
				this.httpRequest.send(postMessage); 
			}
		}
	},

	//when search are ready
	searchReady: function(firstword, type) {
	   	if (this.httpRequest.readyState == 4) {
	   	clearTimeout(this.requestTimer);
			if (this.httpRequest.status == 200) {
				var html = this.cleanUpHTML(this.httpRequest.responseText);
				var doc = this.domParser.parseFromString(html, "text/xml");
				var labelTextElement = this.resetContents();
				var el	= doc.getElementsByTagName('form');
				var lis = el[0].getElementsByTagName("a");
				if (lis.length == 0) {
					this.createActivityLabel(
						this.strings.getString('nothingFound'));
				} else {
					var fullword = lis[0].textContent;
					if (lis.length > 1) {
						fullword += ';'
						for (i=1;i < lis.length;i++) {
							fullword += lis[i].textContent;
							if (i < lis.length-1) {
								fullword += ';'
							}
						}
					}
					fullword = fullword.replace(/\ /g,'+');
					this.getPaging(doc.getElementsByTagName('input'), type, 
						firstword, fullword);

					for (i=0;i<lis.length;i++) {
						var link = lis[i].textContent.replace(' ','+');
						var iframe = document.createElement('iframe');
						labelTextElement.appendChild(iframe);
						iframe.setAttribute('flex',1);
						var descr = this.getWordList(link, fullword, type,
							this.getListReady, iframe);
					}
				}
			} else {
				this.createActivityLabel(
					this.strings.getFormattedString(
						'errorLoadingPage_status', [ this.httpRequest.status ]));
			}
		}
	},
	
	//get paging infocreateActivityLabel
	getPaging: function(elems, selectedType, firstword, fullword) {
		this.resetPaging();
		if (elems) {
			for (i=0; i<elems.length; i++) {
				if (elems[i].getAttribute('value') == '>>') {
					this.pageNext = true;
					//we have next
				}
				if (elems[i].getAttribute('name') == 'MORE') {
					if (this.pageNext) {
						this.moreWords = 
							parseInt(elems[i].getAttribute('value'));
					}
				}
				if (elems[i].getAttribute('value') == '<<') {
					//we have prev
					this.pagePrev = true;
				}
				if (elems[i].getAttribute('name') == 'HEAD') {
					//how many word before
					if (this.pagePrev) {
						this.prevCount = 
							parseInt(elems[i].getAttribute('value'));
					}
				}
			}
		}
		if (this.pagePrev) {
			parent = document.getElementById('paging');
			var button = document.createElement('button');
			parent.appendChild(button);
			button.setAttribute('id','search-prev');
			button.setAttribute('label',this.strings.getString('Previous'));
			button.setAttribute('oncommand', 
				'DaringFx.search(\'' + firstword + '\', ' 
				+ selectedType + ', \'' + '' + '\',\'' 
				+ fullword + '\',' + this.prevCount + ',' 
				+ this.moreWords + ',\'' 
				+ DaringFx.ARG_PERINTAH2_PREV + '\');');
		}
		if (this.pageNext) {
			parent = document.getElementById('paging');
			var button = document.createElement('button');
			parent.appendChild(button);
			button.setAttribute('id','search-next');
			button.setAttribute('label',this.strings.getString('Next'));
			button.setAttribute('oncommand', 
				'DaringFx.search(\'' + firstword + '\', ' 
				+ selectedType + ', \'' + '' + '\',\'' 
				+ fullword + '\',' + this.prevCount + ',' 
				+ this.moreWords + ',\'' 
				+ DaringFx.ARG_PERINTAH2_NEXT + '\');');
		}
	},
	
	//does what it said
	resetPaging: function() {
		//reset all
		var labelTextElement = document.getElementById('paging');
		while (labelTextElement.firstChild) {
			labelTextElement.removeChild(labelTextElement.firstChild);
		}
		this.pageNext = false;
		this.moreWords = 0;
		this.pagePrev = false;
		this.prevCount = 0;
	},
	
	//reset all status
	resetContents: function() {
		var labelTextElement = document.getElementById('results-link');
		while (labelTextElement.firstChild) {
			labelTextElement.removeChild(labelTextElement.firstChild);
		}
		return labelTextElement;
	},

	//reset search result
	resetSearch: function() {
		this.resetContents();
		this.resetPaging();
		this.search(
			document.getElementById('search-box').value,
			document.getElementById('option-button')
				.getAttribute('selectedtype'),
			'', '', 0, 0, '');
	},
	
	//search each word
	getWordList: function(singleword,fullword, type, callbackOnReadyChange, 
			elem) {
		var postData = 'DFTKATA=' + fullword + '&HEAD=0&KATA=' + singleword 
			+ '&MORE=0&OPKODE=' + type + '&PARAM=&PERINTAH2=Tampilkan';
		var httpRequest = new XMLHttpRequest();
		httpRequest.open(
				DaringFx.FORM_METHOD, DaringFx.BASE_URL, true);
		httpRequest.setRequestHeader("Pragma", "no-cache");
		httpRequest.setRequestHeader("Content-type", 
			"application/x-www-form-urlencoded");
		httpRequest.onreadystatechange = function() { 
			DaringFx.getWordListReady(httpRequest, elem); 
		};
	  	httpRequest.send(postData); 
	},

	//when all words are parsed
	getWordListReady: function (request,elem) {
		if (request.readyState == 4) {
	  		if(request.status == 200) {
				var html = this.cleanUpHTML(request.responseText);
				//prompt('',html);
		        var doc = null;
				try {
					doc = this.domParser.parseFromString(html, "text/xml");
					var iframecontent = this.makeWordDefinition(html);
					elem.setAttribute('src',iframecontent);
				} catch(err) {
					this.createActivityLabel(this.strings.getFormattedString(
						'error_Message_is', [ err ]));
				}
			} else {
				this.createActivityLabel(
					this.strings.getFormattedString(
						'errorLoadingPage_status', [ request.status ]));
	  		}
		}
	},
	
	//make iframe for each word available
	makeWordDefinition: function(str) {
		//make iframe content for each dftkata;
		//simple approach, just scrap the content and put it on dataurl
		var result = 'data:text/html,<html><link href="'+
			'chrome://browser/content/browser.css" type="text/css"/><body>';
		var end = '</body></html>';
		// i wish the author put an div here
		pos1 = str.indexOf('<p style="margin-left:.5in;text-indent:-.5in">');
		if (pos1 >=0) {
			pos2 = str.indexOf('</p>', pos1);
			result = result + str.substring(pos1+46,pos2) + end;
			//..so i don't have to use this function, just make use of gParser;
		}
		return result;
	},

	//please read comment...
	cleanUpHTML: function(str) {
		//strip meta, htmlparse complaint because,
	   	str = str.replace(/(<meta[^>]+[^\/])>/ig, ""); 
		//webdeveloper forget to use comment and CDATA
	    str = str.replace('<script type="text/javascript">', 
			'<script type="text/javascript"><!--'); 
		str = str.replace('</head>','--></head>'); //so i n33d to fix this and..
		str = HTMLtoXML(str); //I have to use htmlparser...
		return str;
	},

	//status, error, bla-bla-bla
	createActivityLabel: function(text) {
			var labeltextlink = document.getElementById('results-link');
			while (labeltextlink.firstChild) {
				labeltextlink.removeChild(labeltextlink.firstChild);
			}
			var textEl  = document.createElement('label');
			labeltextlink.appendChild(textEl);
			textEl.setAttribute('value',text);
	},
};

//window.addEventListener("SidebarFocused",function() { DaringFx.init() }, false);

//base
DaringFx.BASE_URL       = 'http://pusatbahasa.diknas.go.id/kbbi/index.php';
DaringFx.TIMEOUT        = 9000;
//forms
DaringFx.FORM_ID        = 'CARIKATA';
DaringFx.FORM_NAME      = 'CARIKATA';
DaringFx.FORM_METHOD    = 'POST';

//forms args:
DaringFx.ARG_OPKODE     	= 'OPKODE';
DaringFx.ARG_OPKODE_EQ  	= 1;
DaringFx.ARG_OPKODE_START   = 2;
DaringFx.ARG_OPKODE_CONTAIN = 3;
DaringFx.ARG_PARAM      	= 'PARAM';
DaringFx.ARG_SUBMIT     	= 'Cari'
DaringFx.ARG_SUBMIT_VAL 	= 'PERINTAH'
DaringFx.ARG_PERINTAH2  	= 'PERINTAH2';
DaringFx.ARG_PERINTAH2_SHOW = 'Tampilkan';
DaringFx.ARG_KATA       	= 'KATA';
DaringFx.ARG_DFTKATA    	= 'DFTKATA';

DaringFx.ARG_MORE       = 0;
DaringFx.ARG_HEAD       = 0;
DaringFx.ARG_PERINTAH2_NEXT = 'Berikut';
DaringFx.ARG_PERINTAH2_PREV = 'Sebelum';

//EXT
DaringFx.MIN_CHAR		= 1;

//end
