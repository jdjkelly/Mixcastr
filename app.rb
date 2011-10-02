require 'sinatra'
require 'soundcloud'

get '/' do
	# register a client with YOUR_CLIENT_ID as client_id_
	# client = Soundcloud.new(:client_id => '3c3aecf09c9a6e46e721f6118612ca59')
	# get 10 hottest tracks
	# @tracks = client.get('/users/28428/tracks')
	@query = params[:q]
	if @query.nil?
		erb :index
	else
		erb :tracks
	end
end

get '/less' do
	erb :less
end