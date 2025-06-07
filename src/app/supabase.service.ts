import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { environment } from '../environments/environment.development';
import { BehaviorSubject, from } from 'rxjs';
import { User } from './user';
import { Router } from '@angular/router';
import { Message } from './message';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  private authSession: AuthSession | null = null;
  private user = new BehaviorSubject<User | null | undefined>(undefined);

  constructor(private router: Router) { 
    this.supabase.auth.onAuthStateChange((event, session)=>{
      if(event == 'SIGNED_IN'){
        this.user.next({id: session!.user.id, full_name: session!.user.user_metadata['full_name'], avatar_url: session!.user.user_metadata['avatar_url']})
      } else if(event == 'SIGNED_OUT'){
        this.user.next(null);
        router.navigateByUrl('/login');
      } else if(!session?.user){
        this.user.next(null);
        router.navigateByUrl('/login');
      }
    })

  }


  signOut(){
    return this.supabase.auth.signOut();
  }

  googleSignin(response: any){
    return this.supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });
    
  }

  get currentUser(){
    return this.user.asObservable();
  }

  get chatChannel(){
    return this.supabase.channel('test-channel');
  }

  async sendMessage(text: string){
    return await this.supabase.from('message').insert({
      text: text, user_id: this.user.getValue()?.id
    });
  }

  getMessages(){
    return from(this.supabase.from('message').select('text, profile(id, full_name, avatar_url)').limit(20).order('id', {ascending: false}));
  }

  getProfile(id: string){
    return from(this.supabase.from('profile').select('full_name, avatar_url').eq('id', id).single());
  }

}
