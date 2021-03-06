# -*- coding: utf-8 -*-
# original from https://gist.github.com/Markbnj/e1541d15699c4d2d8c98
# added code from gottengeography project, https://gitlab.com/robru/gottengeography
# files scanner/geonames/territories.json and scanner/geonames/countries.json from gottengeography project too

import math
import random
import os
import sys
import json
import numpy as np
import requests

import Options
#pylint from CachePath import *
#import CachePath
#pylint from Utilities import *
from Utilities import message, indented_message, next_level, back_level


# For information on endpoints and arguments see the geonames
# API documentation at:
#
#   http://www.geonames.org/export/web-services.html

class Geonames(object):
	"""
	This class provides a client to call certain entrypoints of the geonames
	API.
	"""
	GEONAMES_API = "http://api.geonames.org/"
	# through this cache many calls to geonames web services are saved
	geonames_cache = []
	# the maximum distance in meters for considering two different coordinates equivalent
	MAX_DISTANCE_METERS = 50

	cities = []

	def __init__(self):
		if Options.config['get_geonames_online']:
			Geonames._base_nearby_url = "{}findNearbyJSON?lat={{}}&lng={{}}&featureClass=P&username={}&lang={}".format(self.GEONAMES_API, Options.config['geonames_user'], Options.config['geonames_language'])
		if self.cities == []:
			next_level()
			message("PRE reading and processing local geonames files", "", 5)
			territories_file = os.path.join(os.path.dirname(__file__), 'geonames/territories.json')
			countries_file = os.path.join(os.path.dirname(__file__), 'geonames/countries.json')
			cities_file = os.path.join(os.path.dirname(__file__), 'geonames/cities1000.txt')

			with open(territories_file, 'r') as territories_file_p:
				territories = json.load(territories_file_p)
			with open(countries_file, 'r') as countries_file_p:
				countries = json.load(countries_file_p)

			with open(cities_file, 'r') as all_cities:
				for line in all_cities:
					col = line.split('\t')
					country_code = col[8]
					state_code = col[10]
					try:
						country_name = countries[country_code]
					except KeyError:
						country_name = ''
					try:
						state_name = territories[country_code + '.' + state_code]
					except KeyError:
						state_name = ''
					city_line = {
						'country_name': country_name,
						'country_code': country_code,
						'region_name': state_name,
						'region_code': state_code,
						'place_name': col[1],
						'place_code': col[0],
						'latitude': float(col[4]),
						'longitude': float(col[5])
					}
					self.cities.append(city_line)
			indented_message("PRE local geonames files read and processed", "", 5)
			back_level()


	@staticmethod
	def lookup_nearby_place(latitude, longitude):
		"""
		Looks up places near a specific geographic location
		"""

		next_level()
		message("looking for geonames in cache...", "", 5)
		for _ in range(len(Geonames.geonames_cache) - 1, -1, -1):
			((c_latitude, c_longitude), result) = Geonames.geonames_cache[_]
			distance = Geonames._distance_between_coordinates(c_latitude, c_longitude, latitude, longitude)
			if distance < Geonames.MAX_DISTANCE_METERS:
				# ok with value from cache!
				indented_message("geoname got from cache", "", 5)
				back_level()
				# # add to cache only if not too close to existing point
				# if distance > Geonames.MAX_DISTANCE_METERS / 2.0:
				# 	Geonames.geonames_cache[(latitude, longitude)] = result
				return result
		indented_message("geonames not found in cache", "", 5)

		# # python2 and 3 versions of json.loads (used inside _decode_nearby_place()) throw different exception, be prepared
		# # see https://stackoverflow.com/questions/53355389/python-2-3-compatibility-issue-with-exception
		# json_parse_exception = json.decoder.JSONDecodeError
		# print("--------------------", json_parse_exception)
		# quit()

		got = False
		if Options.config['get_geonames_online']:
			message("getting geonames online...", "", 5)
			# get country, region (state for federal countries), and place
			try_number = 0
			while True:
				try:
					response = requests.get(Geonames._base_nearby_url.format(str(latitude), str(longitude)), timeout=30)
				except requests.exceptions.RequestException as e:
					# sometimes geonames.org aborts the connection => use local files
					indented_message("error in requests.get", e, 5)
					break
				try:
					result = Geonames._decode_nearby_place(response.text)
					if isinstance(result, dict):
						got = True
						indented_message("geonames got from geonames.org online", "", 5)
						break
					else:
						# result is a number, which means that the request to geonames.org produced  an error
						try_number += 1
						indented_message("geonames.org returned error code, retrying...", "try = " + str(try_number) + ", error code = " + str(result), 5)
				except JSONDecodeError:
				# except json_parse_exception:
					# error when decoding
					# json.loads() function inside _decode_nearby_place() can throw JSONDecodeError (python3) or ValueError (python2):
					try_number += 1
					if try_number <= 3:
						indented_message("error deconding geonames.org response, retrying...", "try = " + str(try_number), 5)
				if try_number == 3:
					indented_message("three errors", "giving up", 5)
					break

		if not got:
			# get country, region (state for federal countries), and place
			message("getting geonames from local files...", "", 5)
			result = min([city for city in Geonames.cities], key=lambda c: Geonames.quick_distance_between_coordinates(c['latitude'], c['longitude'], latitude, longitude))
			result['distance'] = Geonames._distance_between_coordinates(latitude, longitude, result['latitude'], result['longitude'])
			indented_message("geonames got from local files", "", 5)

		# add to cache
		message("adding geonames to cache...", "", 5)
		Geonames.geonames_cache.append(((latitude, longitude), result))
		indented_message("geonames added to cache", "", 5)

		back_level()

		return result


	@staticmethod
	def _decode_nearby_place(response_text):
		"""
		Decodes the response from the geonames nearby place lookup and
		returns the properties in a dict.
		"""
		raw_result = json.loads(response_text)

		# the presence of the 'status' key denotes an error (see http://www.geonames.org/export/webservice-exception.html)
		if 'status' in raw_result:
			result = raw_result['status']['value']
		else:
			result = 0
			if len(raw_result['geonames']) > 0:
				result = {}
				geoname = raw_result['geonames'][0]
				correspondence = {
					'country_name': 'countryName',
					'country_code': 'countryCode',
					'region_name': 'adminName1',
					'region_code': 'adminCode1',
					'place_name': 'name',
					'place_code': 'geonameId',
					'latitude': 'lat',
					'longitude': 'lng',
					'distance': 'distance'
				}
				for index in correspondence:
					# Vatican places don't have region fields, and perhaps others fields could not exist
					if correspondence[index] in geoname:
						result[index] = geoname[correspondence[index]]
					else:
						if index[-5:] == '_code':
							result[index] = Options.config['unspecified_geonames_code']
						else:
							result[index] = ''
		# in case of error result is a number, either 0 (len(raw_result['geonames']) == 0) or the error code got from geonames.org
		return result

	@staticmethod
	def recalculate_mean(old_mean, old_len, new_value, new_len=1):
		return (old_mean * old_len + new_value * new_len) / (old_len + new_len)


	# TODO: This method is never called in the project...
	@staticmethod
	def distance_between_media(media1, media2):
		# calculate the distance between the media gps coordinates
		lat1 = media1.latitude
		lon1 = media1.longitude
		lat2 = media2.latitude
		lon2 = media2.longitude

		return Geonames._distance_between_coordinates(lat1, lon1, lat2, lon2)


	@staticmethod
	def _distance_between_coordinates(lat1, lon1, lat2, lon2):
		# https://gis.stackexchange.com/questions/61924/python-gdal-degrees-to-meters-without-reprojecting
		# Calculate the great circle distance in meters between two points on the earth (specified in decimal degrees)

		next_level()
		message("calculating distance between coordinates...", '(' + str(lat1) + ', ' + str(lon1) + ') - (' + str(lat2) + ', ' + str(lon2) + ')', 7)
		# convert decimal degrees to radians
		r_lat1, r_lon1, r_lat2, r_lon2 = math.radians(lat1), math.radians(lon1), math.radians(lat2), math.radians(lon2)
		# haversine formula
		d_r_lon = r_lon2 - r_lon1
		d_r_lat = r_lat2 - r_lat1
		a = math.sin(d_r_lat / 2.0) ** 2 + math.cos(r_lat1) * math.cos(r_lat2) * math.sin(d_r_lon / 2.0) ** 2
		c = 2.0 * math.asin(math.sqrt(a))
		earth_radius = 6371000.0  # radius of the earth in m
		dist = int(earth_radius * c)
		indented_message("distance between coordinates calculated", str(dist) + " meters", 7)
		back_level()
		return dist


	@staticmethod
	def quick_distance_between_coordinates(lat1, lon1, lat2, lon2):
		# do not output messages in this functions, it is called too many times!
		# convert decimal degrees to radians
		r_lat1, r_lon1, r_lat2, r_lon2 = math.radians(lat1), math.radians(lon1), math.radians(lat2), math.radians(lon2)
		# equirectangular distance approximation
		# got from https://stackoverflow.com/questions/15736995/how-can-i-quickly-estimate-the-distance-between-two-latitude-longitude-points
		earth_radius = 6371000.0  # radius of the earth in m
		x = (r_lon2 - r_lon1) * math.cos(0.5 * (r_lat2 + r_lat1))
		y = r_lat2 - r_lat1
		dist = int(earth_radius * math.sqrt(x*x + y*y))
		return dist


	# the following functions implement k-means clustering, got from https://datasciencelab.wordpress.com/2013/12/12/clustering-with-k-means-in-python/
	# the main function is find_centers
	@staticmethod
	def cluster_points(media_list, mu, time_factor):
		clusters = {}
		for single_media in media_list:
			# bestmukey = min([(i[0], np.linalg.norm(x-mu[i[0]])) for i in enumerate(mu)], key=lambda t:t[1])[0]
			bestmukey = min(
					[
						(
							index_and_point[0],
							np.linalg.norm(Geonames.coordinates(single_media, time_factor) - mu[index_and_point[0]])
						) for index_and_point in enumerate(mu)
					], key=lambda t: t[1]
				)[0]
			try:
				clusters[bestmukey].append(single_media)
			except KeyError:
				clusters[bestmukey] = [single_media]
		return clusters


	@staticmethod
	def reevaluate_centers(clusters, time_factor):
		newmu = []
		keys = sorted(clusters.keys())
		for k in keys:
			newmu.append(np.mean([Geonames.coordinates(_media, time_factor) for _media in clusters[k]], axis=0))
		return newmu


	@staticmethod
	def has_converged(mu, oldmu):
		return set([tuple(a) for a in mu]) == set([tuple(a) for a in oldmu])


	@staticmethod
	def coordinates(single_media, time_factor):
		# if time_factor is zero, then time isn't considered
		return np.array((single_media.latitude, single_media.longitude, single_media.date.timestamp() * time_factor))


	@staticmethod
	def find_centers(media_list, K, time_factor):
		# Initialize to K random centers
		coordinate_list = [Geonames.coordinates(single_media, time_factor) for single_media in media_list]
		try:
			oldmu = random.sample(coordinate_list, K)
		except ValueError:
			oldmu = coordinate_list
		try:
			mu = random.sample(coordinate_list, K)
		except ValueError:
			mu = coordinate_list
		first_time = True
		while first_time or not Geonames.has_converged(mu, oldmu):
			oldmu = mu
			# Assign all points in media_list to clusters
			clusters = Geonames.cluster_points(media_list, mu, time_factor)
			# Reevaluate centers
			mu = Geonames.reevaluate_centers(clusters, time_factor)
			if first_time:
				first_time = False
		cluster_list = [cluster for key, cluster in list(clusters.items())]
		return cluster_list
