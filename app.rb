require 'sinatra'
require 'soundcloud'
# require 'datamapper'

# DataMapper::setup(:default, "sqlite3://#{Dir.pwd}/users.db")

# class User
#    include DataMapper::Resource
#    property :id, Serial
#    property :email, String
#    property :name, String
#    property :created_at, DateTime
# end

# User.auto_migrate! unless User.storage_exists?

# MAIN TRACK APP

get '/' do
	@query = params[:q]
	if @query.nil?
		erb :index
	else
		erb :tracks
	end
end

# AUTH TEST

get '/auth' do
	erb :auth
end

get '/map' do
	erb :map
end

# get '/users' do
#	@users = User.get(:order => [:id.desc ])
#	erb :users
# end

get '/less' do
	erb :less
end