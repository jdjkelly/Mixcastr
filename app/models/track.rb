class Track < ActiveRecord::Base
	def self.search(search)
		# register a client with YOUR_CLIENT_ID as client_id_
		client = Soundcloud.new(:client_id => "3c3aecf09c9a6e46e721f6118612ca59")
		if search
		    client.get("/tracks", :limit => 70, :order => "hotness", :filter => "streamable", :q => search)
		else
			client.get("/tracks", :limit => 70, :order => "hotness", :filter => "streamable")
		end
	end
end
