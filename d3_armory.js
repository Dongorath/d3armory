var apiKey = null;

$(function() {
	apiKey = localStorage.getItem('apiKey');
	if (!apiKey || apiKey == "null") {
		apiKey = prompt('Please enter API Key');
		localStorage.setItem('apiKey', apiKey);
	}
});

var toPercent = function(val) {
	return (Math.round(val * 10000) / 100) + ' %';
};

var affixCharacter = function(afType) {
	switch (afType) {
		case 'utility': return '&#x25c7;';
		case 'enchant': return '&#x21bb;';
		default: return '&#x25c6;';
	}
};

var clearErrors = function() {
	var ulErrs = $('#ulErrors');
	ulErrs.empty();
}

var logError = function(msg) {
	var ulErrs = $('#ulErrors');
	var ts = (new Date()).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
	var liErr = $('<li></li>', { 'text': ts + ' - ' + msg });
	ulErrs.append(liErr);
}

var isError = function(json) {
	if (json.code) {
		var ulErrs = $('#ulErrors');
		var ts = (new Date()).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
		var txt = json.code.toString();
		if (json.reason) {
			txt += ' - ' + json.reason;
		} else {
			txt += ' - ' + json.type + ' - ' + json.detail;
		}
		var liErr = $('<li></li>', { 'text': ts + ' - ' + txt });
		ulErrs.append(liErr);
		return true;
	}
	return false;
};

var GetData = function(heroId) {
	var battleTag = $('#btag').val(),
		ajaxRequest = [],
		setItemTooltip = function(item, td) {
			var storedTooltip = localStorage.getItem(item.tooltipParams),
				fillTooltip = function (itemJson) {
					if (itemJson.set) {
						var found = false;
						for (var i = 0; i < listSets.length; i++) {
							if (listSets[i].name == itemJson.set.name) {
								found = true;
								break;
							}
						}
						if (!found) {
							listSets.push(itemJson.set);
						}
					}
					if (itemJson.id === 'Unique_Ring_107_x1') {
						rorg = true;
					}
					listItemId.push(itemJson.id);
					var ttText = td.html();
					if (itemJson.attributesRaw.Ancient_Rank && itemJson.attributesRaw.Ancient_Rank.max > 0) {
						ttText += '&nbsp(ancien)';
					}
					if (itemJson.seasonRequiredToDrop > 0) {
						ttText += '&nbsp;<div class="is_seasonal">&nbsp;</div>';
					}
					if (itemJson.armor && itemJson.armor.max > 0) {
						ttText += '<br/>'+itemJson.armor.max.toLocaleString()+' armure';
					}
					if (itemJson.dps && itemJson.dps.max > 0) {
						ttText += '<br/>'+(Math.round(itemJson.dps.max*100)/100).toLocaleString()+' DPS';
						ttText += ' ('+itemJson.minDamage.max.toLocaleString()+' - '+itemJson.maxDamage.max.toLocaleString()+' @ '+(Math.round(itemJson.attacksPerSecond.max*100)/100).toLocaleString()+' APS)';
					}
					for (var i = 0; i < itemJson.attributes.primary.length; i++) {
						ttText += '<br/>'+affixCharacter(itemJson.attributes.primary[i].affixType)+'&nbsp;'+itemJson.attributes.primary[i].text;
					}
					for (var i = 0; i < itemJson.attributes.secondary.length; i++) {
						ttText += '<br/>'+affixCharacter(itemJson.attributes.secondary[i].affixType)+'&nbsp;'+itemJson.attributes.secondary[i].text;
					}
					for (var i = 0; i < itemJson.attributes.passive.length; i++) {
						ttText += '<br/>'+affixCharacter(itemJson.attributes.passive[i].affixType)+'&nbsp;'+itemJson.attributes.passive[i].text;
					}
					for (var i = 0; i < itemJson.gems.length; i++) {
						ttText += '<br/>&#x25c8;&nbsp;'+itemJson.gems[i].item.name;
						if (itemJson.gems[i].isJewel && itemJson.gems[i].jewelRank > 0) {
							ttText += ' - Rang ' + itemJson.gems[i].jewelRank.toLocaleString();
						}
						var first = true;
						for (var j = 0; j < itemJson.gems[i].attributes.primary.length; j++) {
							if (first) {
								ttText += ' (';
								first = false;
							} else {
								ttText += ' / ';
							}
							ttText += itemJson.gems[i].attributes.primary[j].text;
						}
						for (var j = 0; j < itemJson.gems[i].attributes.secondary.length; j++) {
							if (first) {
								ttText += ' (';
								first = false;
							} else {
								ttText += ' / ';
							}
							ttText += itemJson.gems[i].attributes.secondary[j].text;
						}
						for (var j = 0; j < itemJson.gems[i].attributes.passive.length; j++) {
							if (first) {
								ttText += ' (';
								first = false;
							} else {
								ttText += ' / ';
							}
							ttText += itemJson.gems[i].attributes.passive[j].text;
						}
						if (!first) {
							ttText += ')';
						}
					}
					td.html(ttText);
				};
			if (storedTooltip) {
				fillTooltip(JSON.parse(storedTooltip));
			} else {
				var a = $.ajax({
					url : 'https://eu.api.battle.net/d3/data'+item.tooltipParams+'?locale=fr_FR&apikey='+apiKey,
					success: function(itemJson) {
						localStorage.setItem(item.tooltipParams, JSON.stringify(itemJson));
						fillTooltip(itemJson);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						logError(textStatus + ' / ' + errorThrown);
					},
					timeout: 0
				});
				ajaxRequest.push(a);
			}
		},
		setLegendaryPowerTooltip = function(item, td) {
			var storedTooltip = localStorage.getItem(item.tooltipParams),
				fillTooltip = function (itemJson) {
					if (itemJson.id === 'P3_Unique_Ring_107') {
						rorg = true;
					}
					var ttText = td.html();
					if (itemJson.seasonRequiredToDrop > 0) {
						ttText += '&nbsp;<div class="is_seasonal">&nbsp;</div>';
					}
					// let's hope it's always the first secondary attribute, since we don't have the color info anymore...
					if (itemJson.attributes.secondary.length > 0) {
						ttText += '<br>'+itemJson.attributes.secondary[0].text;
					}
					td.html(ttText);
				};
			if (storedTooltip) {
				fillTooltip(JSON.parse(storedTooltip));
			} else {
				var a = $.ajax({
					url : 'https://eu.api.battle.net/d3/data'+item.tooltipParams+'?locale=fr_FR&apikey='+apiKey,
					success: function(itemJson) {
						localStorage.setItem(item.tooltipParams, JSON.stringify(itemJson));
						fillTooltip(itemJson);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						logError(textStatus + ' / ' + errorThrown);
					},
					timeout: 0
				});
				ajaxRequest.push(a);
			}
		},
		listItemId = [],
		listSets = [],
		rorg = false,
		fillHeroTable = function(json) {
			var cells = ['heroName', 'heroClass', 'heroLevel', 'heroParagon', 'heroSeason', 'heroHardcore', 'heroDps', 'heroAS', 'heroCritChance', 'heroArmor',
				'heroLife', 'heroToughness', 'heroLifePerSec', 'heroLifeOnHit', 'heroLifeOnKill', 'heroLifeSteal', 'heroBlockChance', 'heroBlockMin', 'heroBlockMax',
				'heroStrength', 'heroDex', 'heroVitality', 'heroIntel',
				'heroResistPhysical', 'heroResistFire', 'heroResistCold', 'heroResistLightning', 'heroResistPoison', 'heroResistArcane',
				'heroThorns', 'heroGoldFind', 'heroPrimRes', 'heroSecRes'],
				dataLocation = ['name', 'class', 'level', 'paragonLevel', function(jsonData) {
					if (jsonData.seasonCreated) {
						return jsonData.seasonCreated;
					} else {
						return 'N.A.';
					}
				}, function(jsonData) {
					if (jsonData.hardcore) {
						if (!jsonData.alive) {
							return String.fromCharCode(9760);
						} else {
							return String.fromCharCode(10004);
						}
					}
					return String.fromCharCode(10008);
				}, ['stats', 'damage'], ['stats', 'attackSpeed'], function(jsonData) { return toPercent(jsonData.stats.critChance || 0); },
				['stats', 'armor'], ['stats', 'life'], ['stats', 'toughness'], ['stats', 'healing'], ['stats', 'lifeOnHit'], ['stats', 'lifePerKill'], ['stats', 'lifeSteal'],
				function(jsonData) { return toPercent(jsonData.stats.blockChance || 0); }, ['stats', 'blockAmountMin'], ['stats', 'blockAmountMax'],
				['stats', 'strength'], ['stats', 'dexterity'], ['stats', 'vitality'], ['stats', 'intelligence'],
				['stats', 'physicalResist'], ['stats', 'fireResist'], ['stats', 'coldResist'], ['stats', 'lightningResist'], ['stats', 'poisonResist'], ['stats', 'arcaneResist'],
				['stats', 'thorns'], function(jsonData) { return toPercent(jsonData.stats.goldFind || 0); },
				['stats', 'primaryResource'], ['stats', 'secondaryResource']],
				toonLocations = {'toonHead': 'head', 'toonShoulder': 'shoulders', 'toonAmulet': 'neck', 'toonTorso': 'torso', 'toonHands': 'hands', 'toonBracers': 'bracers', 'toonWaist': 'waist',
					'toonRingLeft': 'leftFinger', 'toonRingRight': 'rightFinger', 'toonLegs': 'legs', 'toonFeet': 'feet', 'toonWeapon': 'mainHand', 'toonOffHand': 'offHand'},
				legendaryPowers = ['toonLegendaryWeapon', 'toonLegendaryArmor', 'toonLegendaryJewel'],
				fillHeroItemsTable = function(itemsJson) {
					var fillTooltip = function (itemJson, td) {
						if (itemJson.set) {
							var found = false;
							for (var i = 0; i < listSets.length; i++) {
								if (listSets[i].name == itemJson.set.name) {
									found = true;
									break;
								}
							}
							if (!found) {
								listSets.push(itemJson.set);
							}
						}
						if (itemJson.id === 'Unique_Ring_107_x1') {
							rorg = true;
						}
						listItemId.push(itemJson.id);
						var ttText = td.html();
						// if (itemJson.attributesRaw.Ancient_Rank && itemJson.attributesRaw.Ancient_Rank.max > 0) {
						// 	ttText += '&nbsp(ancien)';
						// }
						if (itemJson.isSeasonRequiredToDrop) {
							ttText += '&nbsp;<div class="is_seasonal">&nbsp;</div>';
						}
						if (itemJson.armor > 0) {
							ttText += '<br/>'+itemJson.armor.toLocaleString()+' armure';
						}
						if (itemJson.dps) {
							ttText += '<br/>'+itemJson.dps+' DPS';
							ttText += ' ('+itemJson.minDamage.toLocaleString()+' - '+itemJson.maxDamage.toLocaleString()+' @ '+(Math.round(itemJson.attacksPerSecond*100)/100).toLocaleString()+' APS)';
						}
						for (var i = 0; i < itemJson.attributesHtml.primary.length; i++) {
							ttText += '<br/>'+itemJson.attributesHtml.primary[i];
						}
						for (var i = 0; i < itemJson.attributesHtml.secondary.length; i++) {
							ttText += '<br/>'+itemJson.attributesHtml.secondary[i];
						}
						if (itemJson.gems) {
							for (var i = 0; i < itemJson.gems.length; i++) {
								if (itemJson.gems[i].isJewel) {
									ttText += '<br/>&#x25c8;&nbsp;'+itemJson.gems[i].attributes[0].replace(/\n\n/g, '<br>');
								} else {
									ttText += '<br/>&#x25c8;&nbsp;'+itemJson.gems[i].item.name;
									if (itemJson.gems[i].isJewel && itemJson.gems[i].jewelRank > 0) {
										ttText += ' - Rang ' + itemJson.gems[i].jewelRank.toLocaleString();
									}
									var first = true;
									for (var j = 0; j < itemJson.gems[i].attributes.length; j++) {
										if (first) {
											ttText += ' (';
											first = false;
										} else {
											ttText += ' / ';
										}
										ttText += itemJson.gems[i].attributes[j];
									}
									if (!first) {
										ttText += ')';
									}
								}
							}
						}
						td.html(ttText);
					};
					localStorage.setItem(battleTag+'-'+heroId+'-items', JSON.stringify(itemsJson));
					for (var c in toonLocations) {
						var td = $('#'+c),
							item = itemsJson[toonLocations[c]];
						if (!item) {
							continue;
						}
						fillTooltip(item, td);
					}
				},
				storedHeroItems;
			if (isError(json)) {
				$('#imgLoad').hide();
				return;
			}
			localStorage.setItem(battleTag+'-'+heroId, JSON.stringify(json));
			$('#tblHero').css('display', 'table');
			for (var i = 0; i < cells.length; i++) {
				var val = '';
				if (typeof(dataLocation[i]) === 'string') {
					val = json[dataLocation[i]];
				} else if (typeof(dataLocation[i]) === 'function') {
					val = dataLocation[i](json);
				} else if (typeof(dataLocation[i]) === 'object') {
					val = json;
					for (var j = 0; j < dataLocation[i].length; j++) {
						val = val[dataLocation[i][j]];
					}
				}
				if (typeof(val) === 'number') {
					val = (Math.round(val * 100) / 100).toLocaleString();
				}
				$('#'+cells[i]).text(val);
			}

			var toon = $('#divToon');
			// Init items with what we have in the main profile data...
			for (var c in toonLocations) {
				var td = $('#'+c);
				var item = json.items[toonLocations[c]];
				if (!item) {
					td.removeAttr('class');
					td.html('&#x2718;');
					continue;
				}
				td.html('<span class="item_'+item.displayColor+'">'+item.name+'</span>');
			}
			// ... and complete with detailed info from only 1 ajax call
			storedHeroItems = localStorage.getItem(battleTag+'-'+heroId+'-items');
			if (storedHeroItems) {
				fillHeroItemsTable(JSON.parse(storedHeroItems));
			} else {
				var a = $.ajax({
					url : 'https://eu.api.battle.net/d3/profile/'+battleTag+'/hero/'+heroId+'/items?locale=fr_FR&apikey='+apiKey,
					success: fillHeroItemsTable,
					error: function(jqXHR, textStatus, errorThrown) {
						logError(textStatus + ' / ' + errorThrown);
					},
					timeout: 0
				});
				ajaxRequest.push(a);
			}
			for (var i = 0; i < legendaryPowers.length; i++) {
				var td = $('#'+legendaryPowers[i]);
				var item = json.legendaryPowers[i];
				if (!item) {
					td.removeAttr('class');
					td.html('&#x2718;');
					continue;
				}
				td.html('<span class="item_'+item.displayColor+'">'+item.name+'</span>');
				if (item.tooltipParams.indexOf('/item/') === 0) {
					setLegendaryPowerTooltip(item, td);
				}
			}
			var sets = $('#divSets');
			sets.html('');
			toon.css('display', 'block');
			$.when.apply($, ajaxRequest).done(function () {
				var setsHtml = '';
				for (var i = 0; i < listSets.length; i++) {
					if (i > 0) {
						setsHtml += '<br/>';
					}
					setsHtml += '&#x2756;&nbsp;' + listSets[i].descriptionHtml;
				}
				sets.html(setsHtml);
				sets.css('display', 'block');
				$('#imgLoad').hide();
			});
		},
		storedHero;
	if (!battleTag || !heroId) {
		return;
	}
	storedHero = localStorage.getItem(battleTag+'-'+heroId);
	if (storedHero) {
		fillHeroTable(JSON.parse(storedHero));
	} else {
		$.ajax({
			url : 'https://eu.api.battle.net/d3/profile/'+battleTag+'/hero/'+heroId+'?locale=fr_FR&apikey='+apiKey,
			success: fillHeroTable,
			error: function(jqXHR, textStatus, errorThrown) {
				logError(textStatus + ' / ' + errorThrown);
			},
			timeout: 0
		});
		$('#imgLoad').show();
	}
};

var GetProfile = function() {
	var battleTag = $('#btag').val(),
		storedProfile = localStorage.getItem(battleTag),
		fillProfile = function(json, status) {
			if (isError(json)) {
				$('#imgLoad').hide();
				return;
			}
			var invalidateCache = false;
			if (jsonStoredProfile) {
				if (jsonStoredProfile.lastUpdated < json.lastUpdated) {
					invalidateCache = true;
					localStorage.setItem(battleTag, JSON.stringify(json));
				}
			} else {
				invalidateCache = true;
				localStorage.setItem(battleTag, JSON.stringify(json));
			}
			var profileDiv = $('#lstHeroes');
			profileDiv.css('display', 'block');
			profileDiv.html('');
			$('#divSeasons').css('display', 'block');
			var nonSeason = $('<div></div>', { id: 'divNonSeason' }).appendTo(profileDiv);
			var season = $('<div></div>', { id: 'divSeason' }).appendTo(profileDiv);
			$('<span>Non Season :</span>').appendTo(nonSeason);
			$('<span>Season :</span>').appendTo(season);
			var ulNonSeason = $('<ul></ul>').appendTo(nonSeason);
			var ulSeason = $('<ul></ul>').appendTo(season);
			var lastPlayed = json.lastHeroPlayed;
			for (var i = 0; i < json.heroes.length; i++) {
				var heroe = json.heroes[i];
				if (invalidateCache) {
					localStorage.removeItem(battleTag+'-'+heroe.id);
					localStorage.removeItem(battleTag+'-'+heroe.id+'-items');
				}
				var heroText = heroe.name+' <span class="hero_level';
				if (heroe.hardcore) {
					heroText += ' is_hardcore';
				}
				if (heroe.dead) {
					heroText += ' is_dead';
				}
				heroText += '">'+heroe.level+' ('+heroe.paragonLevel+')</span>';
				$('<li></li>', {
					html : heroText,
					'data-heroid': heroe.id,
					click: function() {
						GetData($(this).attr('data-heroid'));
						return false;
					},
					'class': heroe.classSlug + (heroe.id == lastPlayed ? ' lastHero' : '')}).appendTo(heroe.seasonal ? ulSeason : ulNonSeason);
			}
			$('#tblSeasons > tbody > tr:not(#trSeasonsHeader)').remove();
			var lines = '';
			var seasons = [];
			for (var s in json.seasonalProfiles) {
				seasons[json.seasonalProfiles[s].seasonId] = json.seasonalProfiles[s];
			}
			for (var i=seasons.length - 1; i >= 0; i--) {
				if (seasons[i]) {
					lines += '<tr>';
					lines += '<td class="center">' + seasons[i].seasonId + '</td>';
					lines += '<td class="nb">' + seasons[i].paragonLevel.toLocaleString() + '</td>';
					lines += '<td class="nb">' + seasons[i].kills.monsters.toLocaleString() + '</td>';
					lines += '<td class="nb">' + seasons[i].kills.elites.toLocaleString() + '</td>';
					lines += '</tr>';
				}
			}
			$('#tblSeasons').append($(lines));
			$('#imgLoad').hide();
		},
		jsonStoredProfile = null;
	$('#tblHero').css('display', 'none');
	$('#divToon').css('display', 'none');
	$('#divSets').css('display', 'none');
	if (storedProfile != null) {
		jsonStoredProfile = JSON.parse(storedProfile);
	}
	$.ajax({
		url : 'https://eu.api.battle.net/d3/profile/'+battleTag+'/?locale=fr_FR&apikey='+apiKey,
		success: fillProfile,
		error: function(jqXHR, textStatus, errorThrown) {
			logError(textStatus + ' / ' + errorThrown);
		},
		timeout: 0
	});
	$('#imgLoad').show();
};
